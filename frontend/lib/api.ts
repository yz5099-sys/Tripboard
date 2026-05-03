export type RiskLevel = "low" | "medium" | "high";

export type ReportInsight = {
  fileName: string;
  fileType: string;
  extractedText: string;
  summary: string;
  risk: RiskLevel;
  findings: string[];
  suggestion: string;
  recommendedReviewInterval: string;
  urgentSignals: string[];
  disclaimer: string;
  rawModelText: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const apiPathPrefix = process.env.NEXT_PUBLIC_API_BASE_URL ? "" : "/api";

export async function analyzeReportFile(input: {
  file: File;
  patientName: string;
  tumorType: string;
  surgeryDate: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("patientName", input.patientName);
  formData.append("tumorType", input.tumorType);
  formData.append("surgeryDate", input.surgeryDate);

  const response = await fetch(`${apiBaseUrl}${apiPathPrefix}/reports/analyze`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail || "报告解析失败，请稍后重试。");
  }

  return (await response.json()) as ReportInsight;
}

export type TravelLanguage = "en" | "zh";

export type TravelDestinationInput = {
  country: string;
  region: string;
  city: string;
};

export type TravelPlaceSuggestion = {
  id: string;
  name: Record<TravelLanguage, string>;
  image: string;
  description: Record<TravelLanguage, string>;
  duration: number;
  rating: number;
  kind: "popular" | "niche";
};

export type TravelSuggestionResponse = {
  suggestions: TravelPlaceSuggestion[];
  source: "ai" | "local";
  rawModelText: string;
};

export async function fetchTravelSuggestions(input: {
  destination: TravelDestinationInput;
  startDate: string;
  endDate: string;
  travelers: string;
  language: TravelLanguage;
}) {
  const response = await fetch(`${apiBaseUrl}${apiPathPrefix}/travel/suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail || "AI 推荐生成失败，请稍后重试。");
  }

  return (await response.json()) as TravelSuggestionResponse;
}
