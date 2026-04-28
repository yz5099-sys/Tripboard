export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
  };
};

export type PatientProfileRow = {
  user_id: string;
  email: string;
  full_name: string;
  tumor_type: string;
  surgery_date: string | null;
};

export type SymptomEntryRow = {
  user_id: string;
  pain: number;
  numbness: string;
  weakness: string;
  gait: string;
  bladder: string;
  night_pain: string;
  weight_loss: string;
  risk_level: string;
  message: string;
  next_step: string;
};

export type ReportAnalysisRow = {
  user_id: string;
  file_name: string;
  file_type: string;
  extracted_text: string;
  ai_summary: string;
  risk_level: string;
  findings: string[];
  suggestion: string;
  recommended_review_interval: string;
  urgent_signals: string[];
  disclaimer: string;
  raw_model_text: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function assertConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("缺少 Supabase 环境变量，请先配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
  }
}

function buildHeaders(accessToken?: string, includeJson = true) {
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { msg?: string; message?: string; error_description?: string } | null;
  return payload?.msg || payload?.message || payload?.error_description || "请求失败";
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function signUpWithPassword(email: string, password: string) {
  assertConfigured();

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: buildHeaders(undefined, true),
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as { session: AuthSession | null; user: AuthSession["user"] | null };
}

export async function signInWithPassword(email: string, password: string) {
  assertConfigured();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: buildHeaders(undefined, true),
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as AuthSession;
}

export async function refreshSession(refreshToken: string) {
  assertConfigured();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: buildHeaders(undefined, true),
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as AuthSession;
}

export async function fetchCurrentUser(accessToken: string) {
  assertConfigured();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: buildHeaders(accessToken, false)
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as AuthSession["user"];
}

async function restFetch<T>(path: string, init: RequestInit, accessToken: string) {
  assertConfigured();

  const includeJson = init.body !== undefined;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...buildHeaders(accessToken, includeJson),
      Prefer: "return=representation",
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

export async function fetchProfile(accessToken: string, userId: string) {
  const rows = await restFetch<PatientProfileRow[]>(
    `patient_profiles?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" },
    accessToken
  );
  return rows[0] || null;
}

export async function upsertProfile(accessToken: string, profile: PatientProfileRow) {
  const rows = await restFetch<PatientProfileRow[]>(
    "patient_profiles?on_conflict=user_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(profile)
    },
    accessToken
  );
  return rows[0];
}

export async function fetchLatestSymptom(accessToken: string, userId: string) {
  const rows = await restFetch<SymptomEntryRow[]>(
    `symptom_entries?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`,
    { method: "GET" },
    accessToken
  );
  return rows[0] || null;
}

export async function insertSymptom(accessToken: string, payload: SymptomEntryRow) {
  const rows = await restFetch<SymptomEntryRow[]>(
    "symptom_entries",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken
  );
  return rows[0];
}

export async function fetchLatestReport(accessToken: string, userId: string) {
  const rows = await restFetch<ReportAnalysisRow[]>(
    `report_analyses?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`,
    { method: "GET" },
    accessToken
  );
  return rows[0] || null;
}

export async function insertReportAnalysis(accessToken: string, payload: ReportAnalysisRow) {
  const rows = await restFetch<ReportAnalysisRow[]>(
    "report_analyses",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken
  );
  return rows[0];
}
