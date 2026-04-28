"use client";

import { useEffect, useRef, useState } from "react";
import { CompareSlider } from "./compare-slider";
import { ProcessTimeline } from "./process-timeline";

type Stage = "idle" | "uploading" | "detecting" | "removing" | "repairing" | "done" | "error";

type ProcessResponse = {
  originalUrl: string;
  processedUrl: string;
  removedItems: string[];
  keptSubject: string;
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp"
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("仅支持 JPG、PNG、HEIC、WEBP 图片。");
      setStage("error");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("图片不能超过 20MB。");
      setStage("error");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setError("");
    setResult(null);
    setDemoMode(false);
    setStage("uploading");

    const timer1 = window.setTimeout(() => setStage("detecting"), 350);
    const timer2 = window.setTimeout(() => setStage("removing"), 1200);
    const timer3 = window.setTimeout(() => setStage("repairing"), 2200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("处理请求失败");
      }

      const payload = (await response.json()) as ProcessResponse;
      setResult(payload);
      setStage("done");
    } catch (requestError) {
      console.error(requestError);
      setDemoMode(true);
      setResult({
        originalUrl: localPreview,
        processedUrl: localPreview,
        removedItems: ["Demo 模式预览", "等待后端接入真实去除效果"],
        keptSubject: "当前为前端预览模式，主体说明使用模拟数据"
      });
      setStage("done");
    } finally {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
      <div className="glass rounded-[32px] border border-white/70 p-5 shadow-panel sm:p-7">
        <div
          className={`rounded-[28px] border-2 border-dashed p-6 transition sm:p-8 ${
            dragging
              ? "border-accent bg-[#fff3ed]"
              : "border-ink/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,249,255,0.88))]"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        >
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-2xl text-white shadow-lg">
              +
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-ink">上传照片，一键净化画面</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65 sm:text-base">
              支持拖拽上传、手机拍照上传，自动修正 EXIF 方向并优先无损压缩。
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-lg"
              >
                上传照片
              </button>
              <label className="cursor-pointer rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink">
                手机拍照
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleFile(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-ink/55">
              <span className="rounded-full bg-white px-3 py-1">JPG / PNG / HEIC / WEBP</span>
              <span className="rounded-full bg-white px-3 py-1">最大 20MB</span>
              <span className="rounded-full bg-white px-3 py-1">最大 8000 x 8000</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a63f21]">{error}</div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-[28px] bg-[#f4f9ff] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan">编辑确认</p>
                <h4 className="mt-1 text-xl font-semibold text-ink">前后对比与下载</h4>
              </div>
              <a
                href={result.processedUrl}
                download
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
              >
                下载结果
              </a>
            </div>
            <CompareSlider beforeSrc={result.originalUrl} afterSrc={result.processedUrl} />
            {demoMode ? (
              <div className="mt-4 rounded-2xl bg-[#fff8ee] px-4 py-3 text-sm text-[#9a5a18]">
                当前显示的是前端 Demo 预览。启动后端后，这里会替换为真实 AI 处理结果。
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 text-sm text-ink/70 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="font-semibold text-ink">保留主体</p>
                <p className="mt-1">{result.keptSubject}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="font-semibold text-ink">已清理元素</p>
                <p className="mt-1">{result.removedItems.join("、")}</p>
              </div>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="mt-6 overflow-hidden rounded-[28px] bg-[#f4f9ff] p-4">
            <img
              src={previewUrl}
              alt="上传预览"
              className="aspect-[4/3] w-full rounded-[22px] object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <ProcessTimeline stage={error ? "error" : stage} />
        <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">MVP 特性</p>
          <div className="mt-4 grid gap-3 text-sm text-ink/75">
            <div className="rounded-2xl bg-white/70 p-4">自动识别人像主体，优先保留居中、面积更大的清晰人物。</div>
            <div className="rounded-2xl bg-white/70 p-4">识别边缘干扰区域并执行背景修复，当前版本可无缝替换为 YOLO + SAM + LaMa。</div>
            <div className="rounded-2xl bg-white/70 p-4">处理完成后可直接下载本地文件，方便后续接入会员、批量处理和水印策略。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
