import base64
import json
import os
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile

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
