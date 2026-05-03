import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .schemas import ReportAnalysisResponse, TravelSuggestionRequest, TravelSuggestionResponse
from .service import (
    ReportAnalysisError,
    TravelSuggestionError,
    analyze_medical_report,
    suggest_travel_places,
)


BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title="Tripboard API", version="0.2.0")

allowed_origins = os.environ.get("CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/reports/analyze", response_model=ReportAnalysisResponse)
@app.post("/reports/analyze", response_model=ReportAnalysisResponse)
async def analyze_report(
    file: UploadFile = File(...),
    patientName: str = Form(default=""),
    tumorType: str = Form(default=""),
    surgeryDate: str = Form(default=""),
) -> ReportAnalysisResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名。")

    suffix = Path(file.filename).suffix.lower()
    allowed_suffixes = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif", ".doc", ".docx", ".txt"}
    if suffix not in allowed_suffixes:
        raise HTTPException(status_code=400, detail="暂不支持该文件类型，请上传 PDF、图片、Word 或 TXT。")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="文件内容为空。")
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件过大，请控制在 15MB 以内。")

    try:
        result = analyze_medical_report(
            file_name=file.filename,
            file_bytes=file_bytes,
            patient_name=patientName,
            tumor_type=tumorType,
            surgery_date=surgeryDate,
        )
    except ReportAnalysisError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - network or SDK failures
        raise HTTPException(status_code=500, detail=f"AI 解析失败：{exc}") from exc

    return ReportAnalysisResponse(
        fileName=result.file_name,
        fileType=result.file_type,
        extractedText=result.extracted_text,
        summary=result.summary,
        risk=result.risk,
        findings=result.findings,
        suggestion=result.suggestion,
        recommendedReviewInterval=result.recommended_review_interval,
        urgentSignals=result.urgent_signals,
        disclaimer=result.disclaimer,
        rawModelText=result.raw_model_text,
    )


@app.post("/api/travel/suggestions", response_model=TravelSuggestionResponse)
@app.post("/travel/suggestions", response_model=TravelSuggestionResponse)
async def travel_suggestions(payload: TravelSuggestionRequest) -> TravelSuggestionResponse:
    destination = payload.destination
    if not destination.country.strip() or not destination.region.strip():
        raise HTTPException(status_code=400, detail="国家和地区为必填项。")

    try:
        result = suggest_travel_places(
            country=destination.country,
            region=destination.region,
            city=destination.city,
            start_date=payload.startDate,
            end_date=payload.endDate,
            travelers=payload.travelers,
            language=payload.language,
        )
    except TravelSuggestionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - network or SDK failures
        raise HTTPException(status_code=500, detail=f"AI 推荐生成失败：{exc}") from exc

    return TravelSuggestionResponse(
        suggestions=result.suggestions,
        source=result.source,
        rawModelText=result.raw_model_text,
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Tripboard backend is running"}
