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


class TravelDestinationInput(BaseModel):
    country: str = Field(default="")
    region: str = Field(default="")
    city: str = Field(default="")


class TravelSuggestionRequest(BaseModel):
    destination: TravelDestinationInput
    startDate: str = Field(default="")
    endDate: str = Field(default="")
    travelers: str = Field(default="")
    language: str = Field(default="en")


class TravelPlaceSuggestion(BaseModel):
    id: str
    name: dict[str, str]
    image: str
    description: dict[str, str]
    duration: int
    rating: float
    kind: str


class TravelSuggestionResponse(BaseModel):
    suggestions: list[TravelPlaceSuggestion]
    source: str = Field(default="ai")
    rawModelText: str = Field(default="")
