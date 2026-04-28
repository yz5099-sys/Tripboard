type ProcessTimelineProps = {
  stage: "idle" | "uploading" | "detecting" | "removing" | "repairing" | "done" | "error";
};

const stages = [
  { key: "detecting", label: "AI 正在识别主体..." },
  { key: "removing", label: "AI 正在清除路人..." },
  { key: "repairing", label: "AI 正在修复背景..." },
  { key: "done", label: "完成！" }
] as const;

export function ProcessTimeline({ stage }: ProcessTimelineProps) {
  const activeIndex = stages.findIndex((item) => item.key === stage);

  if (stage === "idle") {
    return (
      <div className="rounded-[24px] border border-dashed border-ink/15 bg-white/60 p-4 text-sm text-ink/60">
        上传照片后，这里会显示 AI 的处理进度。
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="rounded-[24px] bg-[#fff0eb] p-4 text-sm text-[#a63f21]">
        处理失败，请更换图片或稍后再试。
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-ink p-5 text-white">
      <div className="space-y-3">
        {stages.map((item, index) => {
          const done = activeIndex >= index || stage === "done";
          const current = item.key === stage;

          return (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  done
                    ? "border-white bg-white text-ink"
                    : "border-white/30 bg-white/10 text-white/60"
                }`}
              >
                {done ? "✓" : index + 1}
              </div>
              <div className={current ? "font-semibold text-white" : "text-white/70"}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
