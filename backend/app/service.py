import base64
import json
import os
import ssl
import urllib.parse
import urllib.request
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile

import certifi
from docx import Document
from openai import OpenAI
from pypdf import PdfReader


DISCLAIMER_TEXT = (
    "本建议由 AI 依据您提供的信息生成，仅供健康管理参考，不能替代医生面诊、影像阅片及正式医疗决策。"
    "如症状加重，请立即前往医院。"
)


class ReportAnalysisError(Exception):
    pass


@dataclass
class ReportAnalysisResult:
    file_name: str
    file_type: str
    extracted_text: str
    summary: str
    risk: str
    findings: list[str]
    suggestion: str
    recommended_review_interval: str
    urgent_signals: list[str]
    disclaimer: str
    raw_model_text: str


@dataclass
class TravelSuggestionResult:
    suggestions: list[dict]
    source: str
    raw_model_text: str


class TravelSuggestionError(Exception):
    pass


IMAGE_SEARCH_CACHE: dict[str, str | None] = {}

TRAVEL_IMAGE_LIBRARY = [
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=640&q=80",
]


def _guess_mime_type(suffix: str) -> str:
    mapping = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".heic": "image/heic",
        ".heif": "image/heif",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".txt": "text/plain",
    }
    return mapping.get(suffix.lower(), "application/octet-stream")


def _extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(part.strip() for part in parts if part.strip())


def _extract_docx_text(file_bytes: bytes) -> str:
    document = Document(BytesIO(file_bytes))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
    return "\n".join(paragraph for paragraph in paragraphs if paragraph)


def _extract_plain_text(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_text_from_file(file_name: str, file_bytes: bytes) -> str:
    suffix = Path(file_name).suffix.lower()

    try:
      if suffix == ".pdf":
          return _extract_pdf_text(file_bytes)
      if suffix == ".docx":
          return _extract_docx_text(file_bytes)
      if suffix == ".txt":
          return _extract_plain_text(file_bytes)
    except (ValueError, BadZipFile) as exc:
      raise ReportAnalysisError("文件可以上传，但本地文字提取失败，请改用 PDF、DOCX 或清晰图片重试。") from exc
    except Exception as exc:  # pragma: no cover - parser specific behavior
      raise ReportAnalysisError("读取文档内容时发生错误，请确认文件未损坏后重试。") from exc

    return ""


def build_analysis_prompt(
    file_name: str,
    patient_name: str,
    tumor_type: str,
    surgery_date: str,
    extracted_text: str,
) -> str:
    return f"""
你是一名谨慎的脊椎肿瘤复查报告解读助手。你的职责不是替代医生，而是把患者上传的检查报告整理成清晰、克制、易懂的中文说明。

患者信息：
- 姓名：{patient_name or "未提供"}
- 肿瘤类型：{tumor_type or "未提供"}
- 手术日期：{surgery_date or "未提供"}
- 文件名：{file_name}

如果用户上传的是影像图片，请先尽可能做 OCR，读取其中可见文字。
如果用户上传的是 PDF / Word，请结合文件内容和提取到的文字一起理解。

本地已提取到的可见文字如下：
{extracted_text or "未提取到结构化文字，请直接基于文件内容识别。"}

请输出 JSON，不要输出额外解释，格式如下：
{{
  "summary": "2-4句患者易懂摘要",
  "risk": "low 或 medium 或 high",
  "findings": ["关键发现1", "关键发现2"],
  "suggestion": "下一步建议，避免代替正式医疗决策",
  "recommendedReviewInterval": "例如 1个月内复查 / 3个月复查 / 半年复查 / 建议立即就诊",
  "urgentSignals": ["若有请列出需要立即就医的信号，没有则返回空数组"],
  "disclaimer": "{DISCLAIMER_TEXT}"
}}

判断规则：
- 只有明确出现复发、进展、明显增大、脊髓/马尾受压、神经功能恶化或其他危险信号时，才给 high。
- 不确定时宁可给 medium，不要过度乐观。
- 不要编造检查数值和病理分级。
- 中文表达温和、清晰、可信。
""".strip()


def _build_openai_input(file_name: str, file_bytes: bytes, extracted_text: str) -> list[dict]:
    suffix = Path(file_name).suffix.lower()
    mime_type = _guess_mime_type(suffix)
    encoded = base64.b64encode(file_bytes).decode("utf-8")

    if mime_type.startswith("image/"):
        file_part = {
            "type": "input_image",
            "image_url": f"data:{mime_type};base64,{encoded}",
        }
    else:
        file_part = {
            "type": "input_file",
            "filename": file_name,
            "file_data": f"data:{mime_type};base64,{encoded}",
        }

    content = [file_part]
    if extracted_text:
        content.append(
            {
                "type": "input_text",
                "text": f"本地已提取文字如下，可作为辅助参考：\n{extracted_text[:12000]}",
            }
        )

    return [{"role": "user", "content": content}]


def _parse_model_json(raw_text: str) -> dict:
    text = raw_text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or start >= end:
            raise ReportAnalysisError("AI 返回了无法解析的结果，请稍后重试。")
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise ReportAnalysisError("AI 返回格式不符合预期，请稍后重试。") from exc


def _slugify_place_id(value: str, fallback: str) -> str:
    slug = "".join(char.lower() if char.isalnum() else "-" for char in value).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or fallback


def build_travel_suggestion_prompt(
    *,
    country: str,
    region: str,
    city: str,
    start_date: str,
    end_date: str,
    travelers: str,
    language: str,
) -> str:
    place = ", ".join(part for part in [city, region, country] if part.strip()) or "the destination"
    return f"""
You are an expert travel planner creating place suggestions for an interactive itinerary board.

Trip:
- Destination: {place}
- Country: {country or "not provided"}
- Region: {region or "not provided"}
- City: {city or "not provided"}
- Date range: {start_date or "not provided"} to {end_date or "not provided"}
- Travelers: {travelers or "not provided"}
- UI language preference: {language}

Return JSON only. Do not include Markdown.

Required JSON shape:
{{
  "places": [
    {{
      "nameEn": "English place card title",
      "nameZh": "中文地点卡片标题",
      "descriptionEn": "One useful sentence for travelers.",
      "descriptionZh": "一句对旅行者有用的中文描述。",
      "duration": 90,
      "rating": 4.7,
      "kind": "popular"
    }}
  ]
}}

Rules:
- Return 12 to 16 places.
- Mix famous highlights and niche local ideas.
- "kind" must be "popular" or "niche".
- "duration" must be one of 60, 90, 120, 150, 180.
- "rating" must be between 4.1 and 4.9.
- Do not invent exact ticket prices, opening hours, or booking requirements.
- Make the suggestions specific to the provided destination.
- Keep both English and Chinese text polished and concise.
""".strip()


def _parse_travel_json(raw_text: str) -> dict:
    try:
        return _parse_model_json(raw_text)
    except ReportAnalysisError as exc:
        raise TravelSuggestionError(str(exc)) from exc


def _dynamic_unsplash_url(query: str, index: int) -> str:
    title = query.strip() or f"Travel stop {index + 1}"
    hue = sum(ord(char) for char in title) % 360
    accent = (hue + 38) % 360
    safe_title = (
        title.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl({hue} 62% 42%)"/>
      <stop offset="1" stop-color="hsl({accent} 72% 64%)"/>
    </linearGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0v54" fill="none" stroke="white" stroke-opacity=".16" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="640" height="420" fill="url(#bg)"/>
  <rect width="640" height="420" fill="url(#grid)"/>
  <circle cx="520" cy="78" r="92" fill="white" opacity=".18"/>
  <circle cx="98" cy="330" r="130" fill="white" opacity=".11"/>
  <path d="M118 270c82-110 155-148 226-112 63 32 111 10 178-56v214H118z" fill="white" opacity=".22"/>
  <path d="M88 308c98-96 177-122 252-78 67 39 127 27 222-48v138H88z" fill="#0f172a" opacity=".18"/>
  <text x="46" y="72" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" opacity=".86">Tripboard</text>
  <text x="46" y="340" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="800">{safe_title[:42]}</text>
</svg>
""".strip()
    return f"data:image/svg+xml;charset=UTF-8,{urllib.parse.quote(svg)}"


def _normalize_search_text(value: str) -> str:
    normalized = "".join(char.lower() if char.isalnum() else " " for char in value)
    return " ".join(normalized.split())


def _title_match_score(search_text: str, title: str) -> int:
    search = _normalize_search_text(search_text)
    candidate = _normalize_search_text(title)
    if not search or not candidate:
        return 0
    if candidate == search:
        return 100
    if candidate in search or search in candidate:
        return 85

    search_tokens = set(search.split())
    candidate_tokens = set(candidate.split())
    if not search_tokens or not candidate_tokens:
        return 0
    overlap = len(search_tokens & candidate_tokens)
    return int((overlap / len(search_tokens)) * 70)


def _is_photo_like_url(source: str) -> bool:
    lowered = source.lower()
    return ".svg" not in lowered and "svg.png" not in lowered


def _mediawiki_json(url: str) -> dict | None:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Tripboard travel planner prototype (local development)",
            "Accept": "application/json",
        },
    )

    try:
        context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(request, timeout=4, context=context) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def _fetch_wikipedia_thumbnail(place_name: str, api_base: str) -> str | None:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": place_name,
            "gsrlimit": "5",
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": "640",
            "origin": "*",
        }
    )
    payload = _mediawiki_json(f"{api_base}?{params}")
    if not payload:
        return None

    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return None

    best_source: str | None = None
    best_score = 0
    for page in pages.values():
        if not isinstance(page, dict):
            continue
        score = _title_match_score(place_name, str(page.get("title", "")))
        thumbnail = page.get("thumbnail", {})
        source = thumbnail.get("source") if isinstance(thumbnail, dict) else None
        if (
            isinstance(source, str)
            and source.startswith("http")
            and _is_photo_like_url(source)
            and score > best_score
        ):
            best_score = score
            best_source = source
    return best_source if best_score >= 45 else None


def _fetch_commons_image(place_name: str) -> str | None:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": place_name,
            "gsrnamespace": "6",
            "gsrlimit": "8",
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": "640",
            "origin": "*",
        }
    )
    payload = _mediawiki_json(f"https://commons.wikimedia.org/w/api.php?{params}")
    if not payload:
        return None

    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return None

    best_source: str | None = None
    best_score = 0
    for page in pages.values():
        if not isinstance(page, dict):
            continue

        title = str(page.get("title", "")).removeprefix("File:")
        score = _title_match_score(place_name, title)
        image_info = page.get("imageinfo", [])
        if not image_info or not isinstance(image_info[0], dict):
            continue

        info = image_info[0]
        mime = str(info.get("mime", ""))
        source = info.get("thumburl") or info.get("url")
        if (
            isinstance(source, str)
            and source.startswith("http")
            and mime.startswith("image/")
            and mime != "image/svg+xml"
            and _is_photo_like_url(source)
            and score > best_score
        ):
            best_score = score
            best_source = source

    return best_source if best_score >= 25 else None


def _candidate_image_queries(
    *,
    name_en: str,
    name_zh: str,
    city: str,
    region: str,
    country: str,
) -> list[str]:
    raw_queries = [
        name_en,
        name_zh,
        f"{name_en} {city}",
        f"{name_zh} {city}",
        f"{name_en} {region}",
        f"{name_zh} {region}",
        f"{name_en} {country}",
        f"{name_zh} {country}",
    ]
    queries: list[str] = []
    seen: set[str] = set()
    for query in raw_queries:
        cleaned = " ".join(query.split())
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            queries.append(cleaned)
    return queries


def _fetch_place_photo(
    *,
    name_en: str,
    name_zh: str,
    city: str,
    region: str,
    country: str,
) -> str | None:
    queries = _candidate_image_queries(
        name_en=name_en,
        name_zh=name_zh,
        city=city,
        region=region,
        country=country,
    )
    cache_key = " | ".join(queries)
    if cache_key in IMAGE_SEARCH_CACHE:
        return IMAGE_SEARCH_CACHE[cache_key]

    for query in queries:
        for search in (
            lambda value: _fetch_wikipedia_thumbnail(value, "https://en.wikipedia.org/w/api.php"),
            lambda value: _fetch_wikipedia_thumbnail(value, "https://zh.wikipedia.org/w/api.php"),
            _fetch_commons_image,
        ):
            source = search(query)
            if source:
                IMAGE_SEARCH_CACHE[cache_key] = source
                return source

    IMAGE_SEARCH_CACHE[cache_key] = None
    return None


def _place_image_url(
    *,
    name_en: str,
    name_zh: str,
    city: str,
    region: str,
    country: str,
    index: int,
) -> str:
    query = " ".join(part for part in [name_en, city, region, country] if part.strip())
    return (
        _fetch_place_photo(
            name_en=name_en,
            name_zh=name_zh,
            city=city,
            region=region,
            country=country,
        )
        or _dynamic_unsplash_url(query, index)
    )


def _normalize_travel_suggestions(
    payload: dict,
    *,
    country: str,
    region: str,
    city: str,
) -> list[dict]:
    raw_places = payload.get("places", [])
    if not isinstance(raw_places, list):
        raise TravelSuggestionError("AI 返回格式不符合预期，请稍后重试。")

    suggestions: list[dict] = []
    for index, item in enumerate(raw_places[:16]):
        if not isinstance(item, dict):
            continue

        name_en = str(item.get("nameEn", "")).strip()
        name_zh = str(item.get("nameZh", "")).strip()
        description_en = str(item.get("descriptionEn", "")).strip()
        description_zh = str(item.get("descriptionZh", "")).strip()
        if not name_en or not name_zh or not description_en or not description_zh:
            continue

        try:
            duration = int(item.get("duration", 90))
        except (TypeError, ValueError):
            duration = 90
        duration = min(max(round(duration / 15) * 15, 30), 240)

        try:
            rating = float(item.get("rating", 4.5))
        except (TypeError, ValueError):
            rating = 4.5
        rating = min(max(rating, 4.0), 5.0)

        kind = str(item.get("kind", "niche")).strip().lower()
        if kind not in {"popular", "niche"}:
            kind = "niche"

        suggestions.append(
            {
                "id": f"ai-{_slugify_place_id(name_en, f'place-{index + 1}')}",
                "name": {"en": name_en, "zh": name_zh},
                "image": _place_image_url(
                    name_en=name_en,
                    name_zh=name_zh,
                    city=city,
                    region=region,
                    country=country,
                    index=index,
                ),
                "description": {"en": description_en, "zh": description_zh},
                "duration": duration,
                "rating": round(rating, 1),
                "kind": kind,
            }
        )

    if len(suggestions) < 8:
        raise TravelSuggestionError("AI 推荐数量不足，请稍后重试。")
    return sorted(suggestions, key=lambda item: item["rating"], reverse=True)


def analyze_medical_report(
    *,
    file_name: str,
    file_bytes: bytes,
    patient_name: str,
    tumor_type: str,
    surgery_date: str,
) -> ReportAnalysisResult:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ReportAnalysisError("后端缺少 OPENAI_API_KEY，暂时无法完成真实 AI 解析。")

    client = OpenAI(api_key=api_key)
    extracted_text = extract_text_from_file(file_name=file_name, file_bytes=file_bytes)
    model = os.environ.get("OPENAI_REPORT_MODEL", "gpt-5.4-mini")

    response = client.responses.create(
        model=model,
        input=_build_openai_input(file_name=file_name, file_bytes=file_bytes, extracted_text=extracted_text),
        instructions=build_analysis_prompt(
            file_name=file_name,
            patient_name=patient_name,
            tumor_type=tumor_type,
            surgery_date=surgery_date,
            extracted_text=extracted_text,
        ),
    )

    raw_text = response.output_text.strip()
    payload = _parse_model_json(raw_text)

    return ReportAnalysisResult(
        file_name=file_name,
        file_type=_guess_mime_type(Path(file_name).suffix.lower()),
        extracted_text=extracted_text,
        summary=str(payload.get("summary", "")).strip() or "未生成摘要。",
        risk=str(payload.get("risk", "medium")).strip().lower(),
        findings=[str(item).strip() for item in payload.get("findings", []) if str(item).strip()],
        suggestion=str(payload.get("suggestion", "")).strip() or "建议结合线下专科门诊进一步评估。",
        recommended_review_interval=str(payload.get("recommendedReviewInterval", "")).strip() or "建议近期结合医生意见决定复查时间。",
        urgent_signals=[str(item).strip() for item in payload.get("urgentSignals", []) if str(item).strip()],
        disclaimer=str(payload.get("disclaimer", "")).strip() or DISCLAIMER_TEXT,
        raw_model_text=raw_text,
    )


def suggest_travel_places(
    *,
    country: str,
    region: str,
    city: str,
    start_date: str,
    end_date: str,
    travelers: str,
    language: str,
) -> TravelSuggestionResult:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise TravelSuggestionError("后端缺少 OPENAI_API_KEY，暂时无法生成真实 AI 旅行推荐。")

    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_TRAVEL_MODEL", os.environ.get("OPENAI_REPORT_MODEL", "gpt-5.4-mini"))

    response = client.responses.create(
        model=model,
        input=build_travel_suggestion_prompt(
            country=country,
            region=region,
            city=city,
            start_date=start_date,
            end_date=end_date,
            travelers=travelers,
            language=language,
        ),
    )

    raw_text = response.output_text.strip()
    payload = _parse_travel_json(raw_text)
    return TravelSuggestionResult(
        suggestions=_normalize_travel_suggestions(
            payload,
            country=country,
            region=region,
            city=city,
        ),
        source="ai",
        raw_model_text=raw_text,
    )
