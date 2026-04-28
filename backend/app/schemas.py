from pydantic import BaseModel, Field


class ReportAnalysisResponse(BaseModel):
    fileName: str
    fileType: str
    extractedText: str = Field(default="")
    summary: str
    risk: str
    findings: list[str]
    suggestion: str
    recommendedReviewInterval: str
    urgentSignals: list[str]
    disclaimer: str
    rawModelText: str
