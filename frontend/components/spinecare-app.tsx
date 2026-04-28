"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeReportFile, type ReportInsight, type RiskLevel } from "@/lib/api";
import {
  fetchCurrentUser,
  fetchLatestReport,
  fetchLatestSymptom,
  fetchProfile,
  insertReportAnalysis,
  insertSymptom,
  isSupabaseConfigured,
  refreshSession,
  signInWithPassword,
  signUpWithPassword,
  type AuthSession,
  type PatientProfileRow
} from "@/lib/supabase-rest";
import { upsertProfile } from "@/lib/supabase-rest";

type Profile = {
  name: string;
  email: string;
  password: string;
  tumorType: string;
  surgeryDate: string;
};

type SymptomForm = {
  pain: number;
  numbness: string;
  weakness: string;
  gait: string;
  bladder: string;
  nightPain: string;
  weightLoss: string;
};

const sessionStorageKey = "spinecare-ai-session";

const encouragements = [
  "🌤 今天也辛苦了，恢复是一个过程，不必要求自己立刻变好。",
  "🌷 你已经做得很好了，我们一步一步来。",
  "🌙 规律复查比反复担心更有力量，我们陪你把事情一件件做好。"
];

const tumorOptions = [
  "脊膜瘤",
  "神经鞘瘤",
  "室管膜瘤",
  "星形细胞瘤",
  "转移瘤",
  "骨源性肿瘤",
  "硬膜内外肿瘤",
  "其他/待明确"
];

const defaultProfile: Profile = {
  name: "",
  email: "",
  password: "",
  tumorType: "神经鞘瘤",
  surgeryDate: ""
};

const defaultSymptoms: SymptomForm = {
  pain: 3,
  numbness: "无明显加重",
  weakness: "没有",
  gait: "稳定",
  bladder: "正常",
  nightPain: "没有",
  weightLoss: "没有"
};

const defaultReportInsight: ReportInsight = {
  fileName: "",
  fileType: "",
  extractedText: "",
  summary: "上传报告后，系统会通过 OpenAI 多模态能力做 OCR 与医学解释。",
  risk: "low",
  findings: ["支持 PDF、图片、DOCX、TXT。"],
  suggestion: "建议优先上传清晰的 MRI / CT / 病理报告。",
  recommendedReviewInterval: "待生成",
  urgentSignals: [],
  disclaimer:
    "本建议由 AI 依据您提供的信息生成，仅供健康管理参考，不能替代医生面诊、影像阅片及正式医疗决策。如症状加重，请立即前往医院。",
  rawModelText: ""
};

const symptomFields: Array<{
  key: keyof SymptomForm;
  label: string;
  options: string[];
}> = [
  { key: "numbness", label: "麻木变化", options: ["无明显加重", "较前加重"] },
  { key: "weakness", label: "无力情况", options: ["没有", "轻度无力", "明显无力"] },
  { key: "gait", label: "行走能力", options: ["稳定", "轻度困难", "明显困难"] },
  { key: "bladder", label: "大小便情况", options: ["正常", "异常"] },
  { key: "nightPain", label: "夜间痛醒", options: ["没有", "偶尔", "频繁"] },
  { key: "weightLoss", label: "近期体重", options: ["没有", "明显下降"] }
];

const historyPoints = [
  { month: "1月", pain: 6, symptom: 65 },
  { month: "2月", pain: 5, symptom: 58 },
  { month: "3月", pain: 4, symptom: 42 },
  { month: "4月", pain: 3, symptom: 35 },
  { month: "本周", pain: 3, symptom: 32 }
];

function daysUntil(dateValue: string) {
  const target = new Date(dateValue);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function addDays(dateValue: string, days: number) {
  const base = dateValue ? new Date(dateValue) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function monthsSince(dateValue: string) {
  if (!dateValue) {
    return 2;
  }

  const start = new Date(dateValue);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
}

function getRiskTone(risk: RiskLevel) {
  if (risk === "high") {
    return { label: "高风险", className: "bg-rose-100 text-rose-700 border-rose-200" };
  }
  if (risk === "medium") {
    return { label: "中风险", className: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return { label: "低风险", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
}

function evaluateSymptoms(form: SymptomForm) {
  const redFlags =
    form.bladder === "异常" ||
    form.weakness === "明显无力" ||
    form.gait === "明显困难" ||
    form.nightPain === "频繁" ||
    form.pain >= 8;

  const mediumFlags =
    form.pain >= 5 ||
    form.numbness === "较前加重" ||
    form.weakness === "轻度无力" ||
    form.weightLoss === "明显下降";

  if (redFlags) {
    return {
      risk: "high" as RiskLevel,
      message: "出现神经压迫风险信号，请尽快线下就医。",
      nextStep: "如果伴随大小便异常、行走明显困难或无力加重，建议立即前往医院。"
    };
  }

  if (mediumFlags) {
    return {
      risk: "medium" as RiskLevel,
      message: "建议近期预约门诊复查，进一步确认情况。",
      nextStep: "建议 1 到 2 周内联系医生，并准备近期影像和症状记录。"
    };
  }

  return {
    risk: "low" as RiskLevel,
    message: "当前症状总体稳定，建议继续观察并按计划复查。",
    nextStep: "继续记录每日疼痛变化，保持适度步行和规律作息。"
  };
}

function buildReviewPlan(profile: Profile, reportRisk: RiskLevel, symptomRisk: RiskLevel) {
  const months = monthsSince(profile.surgeryDate);
  const isAggressiveType = ["转移瘤", "星形细胞瘤", "骨源性肿瘤"].includes(profile.tumorType);

  if (reportRisk === "high" || symptomRisk === "high") {
    return {
      title: "建议立即就诊",
      detail: "当前信息提示存在较高风险，应尽快做线下专科评估，并考虑加做增强 MRI 或急诊检查。",
      days: 1
    };
  }

  if (isAggressiveType || reportRisk === "medium" || symptomRisk === "medium") {
    return {
      title: "建议 1 个月内复查",
      detail: "考虑到肿瘤类型或近期变化，建议缩短复查周期，优先安排增强 MRI 和门诊复评。",
      days: 30
    };
  }

  if (months <= 3) {
    return {
      title: "建议 3 个月复查",
      detail: "术后早期更适合密切观察影像和神经功能恢复，建议按季度复查。",
      days: 90
    };
  }

  if (months <= 12) {
    return {
      title: "建议半年复查",
      detail: "若影像和症状都稳定，可以逐步过渡到半年一次的随访节奏。",
      days: 180
    };
  }

  return {
    title: "建议年度复查",
    detail: "当前更接近长期稳定随访阶段，但如有新症状，应提前复查。",
    days: 365
  };
}

function createCalendarFile(title: string, date: Date, notes: string) {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SpineCare AI//Follow Up//CN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${y}${m}${d}`,
    `DTEND;VALUE=DATE:${y}${m}${d}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${notes}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");
}

function reportRowToInsight(row: Awaited<ReturnType<typeof fetchLatestReport>>) {
  if (!row) {
    return defaultReportInsight;
  }

  return {
    fileName: row.file_name,
    fileType: row.file_type,
    extractedText: row.extracted_text,
    summary: row.ai_summary,
    risk: (row.risk_level as RiskLevel) || "medium",
    findings: row.findings || [],
    suggestion: row.suggestion,
    recommendedReviewInterval: row.recommended_review_interval,
    urgentSignals: row.urgent_signals || [],
    disclaimer: row.disclaimer,
    rawModelText: row.raw_model_text
  };
}

function profileRowToProfile(row: PatientProfileRow, current: Profile) {
  return {
    ...current,
    name: row.full_name || current.name,
    email: row.email || current.email,
    tumorType: row.tumor_type || current.tumorType,
    surgeryDate: row.surgery_date || current.surgeryDate
  };
}

export function SpineCareApp() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authStatus, setAuthStatus] = useState("请登录以同步档案和报告。");
  const [profileStatus, setProfileStatus] = useState("");
  const [symptomStatus, setSymptomStatus] = useState("");
  const [notifyStatus, setNotifyStatus] = useState("未开启提醒");
  const [loadingSession, setLoadingSession] = useState(true);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportInsight, setReportInsight] = useState<ReportInsight>(defaultReportInsight);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStatus, setReportStatus] = useState("尚未解析报告。");
  const [symptoms, setSymptoms] = useState<SymptomForm>(defaultSymptoms);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const cached = window.localStorage.getItem(sessionStorageKey);
      if (!cached) {
        setLoadingSession(false);
        return;
      }

      try {
        const parsed = JSON.parse(cached) as AuthSession;
        let nextSession = parsed;

        if (parsed.refresh_token) {
          try {
            nextSession = await refreshSession(parsed.refresh_token);
            window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
          } catch {
            nextSession = parsed;
          }
        }

        const user = await fetchCurrentUser(nextSession.access_token);
        const hydrated = {
          ...nextSession,
          user: { id: user.id, email: user.email }
        };
        setSession(hydrated);
        setProfile((current) => ({ ...current, email: user.email || current.email }));
        setAuthStatus(`已登录：${user.email || "当前用户"}`);
      } catch {
        window.localStorage.removeItem(sessionStorageKey);
      } finally {
        setLoadingSession(false);
      }
    }

    if (!isSupabaseConfigured()) {
      setLoadingSession(false);
      return;
    }

    restoreSession().catch(() => setLoadingSession(false));
  }, []);

  useEffect(() => {
    async function loadRemoteData() {
      if (!session) {
        return;
      }

      const [profileRow, symptomRow, reportRow] = await Promise.all([
        fetchProfile(session.access_token, session.user.id),
        fetchLatestSymptom(session.access_token, session.user.id),
        fetchLatestReport(session.access_token, session.user.id)
      ]);

      if (profileRow) {
        setProfile((current) => profileRowToProfile(profileRow, current));
      }

      if (symptomRow) {
        setSymptoms({
          pain: symptomRow.pain,
          numbness: symptomRow.numbness,
          weakness: symptomRow.weakness,
          gait: symptomRow.gait,
          bladder: symptomRow.bladder,
          nightPain: symptomRow.night_pain,
          weightLoss: symptomRow.weight_loss
        });
      }

      if (reportRow) {
        setReportInsight(reportRowToInsight(reportRow));
        setReportStatus(`已加载最近一次报告：${reportRow.file_name}`);
      }
    }

    loadRemoteData().catch((error: Error) => {
      setAuthStatus(error.message || "读取云端数据失败。");
    });
  }, [session]);

  const loggedIn = Boolean(session?.access_token);
  const symptomAssessment = useMemo(() => evaluateSymptoms(symptoms), [symptoms]);
  const reviewPlan = useMemo(
    () => buildReviewPlan(profile, reportInsight.risk, symptomAssessment.risk),
    [profile, reportInsight.risk, symptomAssessment.risk]
  );
  const nextReviewDate = addDays(profile.surgeryDate || new Date().toISOString(), reviewPlan.days);
  const nextReviewCountdown = daysUntil(nextReviewDate.toISOString());
  const encouragement = encouragements[new Date().getDate() % encouragements.length];
  const overallRisk =
    reportInsight.risk === "high" || symptomAssessment.risk === "high"
      ? "high"
      : reportInsight.risk === "medium" || symptomAssessment.risk === "medium"
        ? "medium"
        : "low";
  const riskTone = getRiskTone(overallRisk);

  async function handleAuthSubmit() {
    if (!isSupabaseConfigured()) {
      setAuthStatus("请先配置 Supabase 环境变量。");
      return;
    }

    if (!profile.email || !profile.password) {
      setAuthStatus("请输入邮箱和密码。");
      return;
    }

    try {
      if (authMode === "register") {
        const result = await signUpWithPassword(profile.email, profile.password);
        if (!result.session) {
          setAuthStatus("注册成功。若 Supabase 开启了邮箱确认，请先完成验证后再登录。");
          return;
        }
        setSession(result.session);
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(result.session));
        setAuthStatus(`注册并登录成功：${result.session.user.email || profile.email}`);
        return;
      }

      const nextSession = await signInWithPassword(profile.email, profile.password);
      setSession(nextSession);
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
      setAuthStatus(`已登录：${nextSession.user.email || profile.email}`);
    } catch (error) {
      setAuthStatus(error instanceof Error ? error.message : "登录失败。");
    }
  }

  async function handleSaveProfile() {
    if (!session) {
      setProfileStatus("请先登录后再保存档案。");
      return;
    }

    try {
      await upsertProfile(session.access_token, {
        user_id: session.user.id,
        email: profile.email,
        full_name: profile.name,
        tumor_type: profile.tumorType,
        surgery_date: profile.surgeryDate || null
      });
      setProfileStatus("患者档案已同步到 Supabase。");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "保存档案失败。");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(sessionStorageKey);
    setSession(null);
    setProfile((current) => ({ ...defaultProfile, email: current.email }));
    setReportInsight(defaultReportInsight);
    setAuthStatus("已退出登录。");
  }

  async function handleEnableNotifications() {
    if (!("Notification" in window)) {
      setNotifyStatus("当前浏览器暂不支持推送通知");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotifyStatus("用户未授权通知");
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.showNotification("SpineCare AI", {
        body: "温柔提醒：距离您下一次复查还有 7 天啦，我们陪着您一起完成。",
        icon: "/icon"
      });
    }
    setNotifyStatus("提醒已开启");
  }

  function handleCalendarDownload() {
    const content = createCalendarFile(
      "SpineCare AI 复查提醒",
      nextReviewDate,
      "按时复查是守护健康的重要一步，如症状加重请提前就医。"
    );
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "spinecare-followup.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleAnalyzeReport() {
    if (!reportFile) {
      setReportStatus("请先选择要解析的报告文件。");
      return;
    }

    setReportLoading(true);
    setReportStatus("正在上传并调用 OpenAI 解析，请稍候……");

    try {
      const result = await analyzeReportFile({
        file: reportFile,
        patientName: profile.name,
        tumorType: profile.tumorType,
        surgeryDate: profile.surgeryDate
      });
      setReportInsight(result);
      setReportStatus(`解析完成：${result.fileName || reportFile.name}`);

      if (session) {
        await insertReportAnalysis(session.access_token, {
          user_id: session.user.id,
          file_name: result.fileName || reportFile.name,
          file_type: result.fileType,
          extracted_text: result.extractedText,
          ai_summary: result.summary,
          risk_level: result.risk,
          findings: result.findings,
          suggestion: result.suggestion,
          recommended_review_interval: result.recommendedReviewInterval,
          urgent_signals: result.urgentSignals,
          disclaimer: result.disclaimer,
          raw_model_text: result.rawModelText
        });
        setReportStatus(`解析完成并已保存：${result.fileName || reportFile.name}`);
      }
    } catch (error) {
      setReportStatus(error instanceof Error ? error.message : "报告解析失败。");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSaveSymptoms() {
    if (!session) {
      setSymptomStatus("请先登录后再保存症状记录。");
      return;
    }

    try {
      await insertSymptom(session.access_token, {
        user_id: session.user.id,
        pain: symptoms.pain,
        numbness: symptoms.numbness,
        weakness: symptoms.weakness,
        gait: symptoms.gait,
        bladder: symptoms.bladder,
        night_pain: symptoms.nightPain,
        weight_loss: symptoms.weightLoss,
        risk_level: symptomAssessment.risk,
        message: symptomAssessment.message,
        next_step: symptomAssessment.nextStep
      });
      setSymptomStatus("本次症状问卷已保存到 Supabase。");
    } catch (error) {
      setSymptomStatus(error instanceof Error ? error.message : "保存症状记录失败。");
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbff_30%,#fefbf6_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(116,143,165,0.16)] backdrop-blur xl:p-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(249,221,226,0.88),transparent_44%),radial-gradient(circle_at_top_right,rgba(220,238,255,0.92),transparent_40%),radial-gradient(circle_at_center,rgba(255,244,204,0.64),transparent_52%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white">S</span>
                SpineCare AI｜脊椎肿瘤复查助手
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-slate-900 sm:text-5xl">
                在复查、症状变化和焦虑之间，
                <span className="text-sky-700"> 给你一个持续陪伴的数字伙伴</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                这版已接入真实的 Supabase 登录与数据持久化，并把报告解析升级为 OpenAI 多模态 OCR + 医学摘要能力。
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-rose-50 px-4 py-2">Supabase 登录</span>
                <span className="rounded-full bg-sky-50 px-4 py-2">OpenAI 报告解析</span>
                <span className="rounded-full bg-amber-50 px-4 py-2">症状问诊</span>
                <span className="rounded-full bg-emerald-50 px-4 py-2">复查建议</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-inner shadow-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">账户与档案</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    {loggedIn ? `${profile.name || "患者"}的复查空间` : "登录并同步到云端"}
                  </h2>
                </div>
                {loggedIn ? (
                  <button className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600" onClick={handleLogout}>
                    退出
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">姓名</span>
                  <input
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-900 outline-none"
                    placeholder="例如：张女士"
                    value={profile.name}
                    onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">邮箱</span>
                  <input
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-900 outline-none"
                    placeholder="name@example.com"
                    value={profile.email}
                    onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">密码</span>
                  <input
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-900 outline-none"
                    type="password"
                    placeholder="至少 6 位"
                    value={profile.password}
                    onChange={(event) => setProfile((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <label className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">肿瘤类型</span>
                  <select
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-900 outline-none"
                    value={profile.tumorType}
                    onChange={(event) => setProfile((current) => ({ ...current, tumorType: event.target.value }))}
                  >
                    {tumorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <span className="text-sm text-slate-500">手术日期（选填）</span>
                  <input
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-900 outline-none"
                    type="date"
                    value={profile.surgeryDate}
                    onChange={(event) => setProfile((current) => ({ ...current, surgeryDate: event.target.value }))}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-400">如果暂时不确定手术时间，可以先留空，后续再补充。</p>
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-base font-medium text-white"
                  onClick={handleAuthSubmit}
                  disabled={loadingSession}
                >
                  {authMode === "login" ? "邮箱密码登录" : "注册并登录"}
                </button>
                <button
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-medium text-slate-700"
                  onClick={() => setAuthMode((current) => (current === "login" ? "register" : "login"))}
                >
                  切换为{authMode === "login" ? "注册" : "登录"}
                </button>
              </div>

              <button
                className="mt-3 w-full rounded-2xl bg-sky-100 px-5 py-3 text-base font-medium text-sky-800"
                onClick={handleSaveProfile}
              >
                保存患者档案到 Supabase
              </button>

              <p className="mt-3 text-sm leading-6 text-slate-500">{authStatus}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{profileStatus}</p>
              {!isSupabaseConfigured() ? (
                <p className="mt-2 text-sm leading-6 text-rose-600">
                  当前未配置 Supabase 环境变量，因此登录和持久化按钮会提示配置缺失。
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_16px_40px_rgba(165,184,202,0.14)]">
            <p className="text-sm text-slate-500">下次复查倒计时</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-900">{nextReviewCountdown}天</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{reviewPlan.title}</p>
          </article>
          <article className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_16px_40px_rgba(165,184,202,0.14)]">
            <p className="text-sm text-slate-500">当前风险</p>
            <div className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${riskTone.className}`}>
              {riskTone.label}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{symptomAssessment.message}</p>
          </article>
          <article className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_16px_40px_rgba(165,184,202,0.14)]">
            <p className="text-sm text-slate-500">今日鼓励语</p>
            <p className="mt-3 text-base leading-7 text-slate-700">{encouragement}</p>
          </article>
          <article className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_16px_40px_rgba(165,184,202,0.14)]">
            <p className="text-sm text-slate-500">云端状态</p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {loadingSession ? "正在恢复登录状态……" : loggedIn ? "已连接 Supabase" : "尚未登录"}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_44px_rgba(165,184,202,0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">模块 B｜OpenAI 报告解析</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">上传报告并生成真实 AI 解读</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">PDF / 图片 / DOCX / TXT</span>
            </div>

            <label className="mt-5 flex cursor-pointer flex-col rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50/60">
              <span className="text-base font-medium text-slate-800">点击选择报告文件</span>
              <span className="mt-2 text-sm leading-6">
                图片会走 OpenAI 视觉 OCR；PDF 和 DOCX 会先抽取文字，再交给模型做医疗摘要。
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.webp"
                onChange={(event) => setReportFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              已选文件：{reportFile?.name || reportInsight.fileName || "暂未上传"}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                onClick={handleAnalyzeReport}
                disabled={reportLoading}
              >
                {reportLoading ? "AI 解析中..." : "开始 AI 解析"}
              </button>
              <span className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{reportStatus}</span>
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,rgba(220,238,255,0.76),rgba(255,255,255,0.95))] p-5">
              <div className="flex items-center gap-3">
                <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getRiskTone(reportInsight.risk).className}`}>
                  {getRiskTone(reportInsight.risk).label}
                </div>
                <p className="text-sm text-slate-500">AI 结论</p>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-800">{reportInsight.summary}</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {reportInsight.findings.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-white/85 px-4 py-3 text-sm leading-6 text-slate-700">{reportInsight.suggestion}</p>
              <p className="mt-4 text-sm leading-6 text-slate-500">建议复查周期：{reportInsight.recommendedReviewInterval}</p>
            </div>

            {reportInsight.extractedText ? (
              <label className="mt-4 block rounded-[24px] bg-slate-50 p-4">
                <span className="text-sm text-slate-500">OCR / 文本抽取结果</span>
                <textarea
                  className="mt-3 min-h-36 w-full resize-none border-0 bg-transparent text-sm leading-7 text-slate-700 outline-none"
                  value={reportInsight.extractedText}
                  readOnly
                />
              </label>
            ) : null}
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_44px_rgba(165,184,202,0.16)]">
            <p className="text-sm text-slate-500">模块 C｜症状问诊评估</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">每日 / 每周动态问诊</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-slate-50 p-4">
                <span className="text-sm text-slate-500">今日疼痛等级：{symptoms.pain}</span>
                <input
                  className="mt-3 w-full"
                  type="range"
                  min={0}
                  max={10}
                  value={symptoms.pain}
                  onChange={(event) => setSymptoms((current) => ({ ...current, pain: Number(event.target.value) }))}
                />
              </label>
              {symptomFields.map(({ key, label, options }) => (
                <label key={key} className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">{label}</span>
                  <select
                    className="mt-2 w-full border-0 bg-transparent text-base text-slate-800 outline-none"
                    value={symptoms[key]}
                    onChange={(event) => setSymptoms((current) => ({ ...current, [key]: event.target.value }))}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,244,204,0.7),rgba(255,255,255,0.95))] p-5">
              <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getRiskTone(symptomAssessment.risk).className}`}>
                {getRiskTone(symptomAssessment.risk).label}
              </div>
              <p className="mt-4 text-base leading-7 text-slate-800">{symptomAssessment.message}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{symptomAssessment.nextStep}</p>
            </div>

            <button className="mt-4 rounded-2xl bg-sky-100 px-5 py-3 text-sm font-medium text-sky-800" onClick={handleSaveSymptoms}>
              保存本次症状记录
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-500">{symptomStatus}</p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_44px_rgba(165,184,202,0.16)]">
            <p className="text-sm text-slate-500">模块 D｜AI 复查周期判断</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{reviewPlan.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">{reviewPlan.detail}</p>
            <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
              <p className="text-sm text-slate-500">建议下次复查日期</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{nextReviewDate.toLocaleDateString("zh-CN")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">依据：肿瘤类型、手术时间、AI 报告风险、症状风险四项综合生成。</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white" onClick={handleEnableNotifications}>
                开启浏览器提醒
              </button>
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700" onClick={handleCalendarDownload}>
                下载日历提醒
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">{notifyStatus}</p>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_44px_rgba(165,184,202,0.16)]">
            <p className="text-sm text-slate-500">数据页</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">症状趋势与随访轨迹</h2>
            <div className="mt-6 space-y-4">
              {historyPoints.map((point) => (
                <div key={point.month}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>{point.month}</span>
                    <span>疼痛 {point.pain} / 症状指数 {point.symptom}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-3 overflow-hidden rounded-full bg-rose-100">
                      <div className="h-full rounded-full bg-rose-300" style={{ width: `${point.pain * 10}%` }} />
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-sky-100">
                      <div className="h-full rounded-full bg-sky-300" style={{ width: `${point.symptom}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,rgba(249,221,226,0.56),rgba(220,238,255,0.56),rgba(255,244,204,0.56))] p-5">
              <p className="text-base leading-7 text-slate-800">
                当前趋势图仍是 MVP 示例数据。后续可以继续扩展成从 `symptom_entries` 自动聚合出的真实周/月曲线。
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-rose-100 bg-rose-50/86 p-6 shadow-[0_18px_44px_rgba(222,149,169,0.08)]">
          <p className="text-sm font-medium text-rose-700">⚠️ 风险提示</p>
          <p className="mt-3 text-sm leading-7 text-rose-800">{reportInsight.disclaimer}</p>
        </section>
      </div>
    </main>
  );
}
