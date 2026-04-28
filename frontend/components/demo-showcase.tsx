export function DemoShowcase() {
  return (
    <div className="grid gap-4 rounded-[32px] border border-white/70 bg-white/70 p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-cyan">示例效果</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">像原本就没有出现过</h3>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-xs font-semibold text-ink">
          3 秒内完成
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-[24px] bg-[#d8e7f6] p-3">
          <div className="relative aspect-[4/3] rounded-[18px] bg-[linear-gradient(180deg,#6cc6dd_0%,#d8efe5_38%,#dcb996_39%,#d1b08c_100%)]">
            <div className="absolute left-[20%] top-[22%] h-32 w-20 rounded-full bg-[#17324a]" />
            <div className="absolute left-[17%] top-[40%] h-36 w-28 rounded-[50px] bg-[#f97352]" />
            <div className="absolute right-[16%] top-[30%] h-28 w-16 rounded-full bg-[#5c7893] opacity-90" />
            <div className="absolute right-[11%] top-[42%] h-28 w-24 rounded-[40px] bg-[#2f4858] opacity-90" />
            <div className="absolute right-[30%] top-[37%] h-20 w-10 rounded-full bg-[#6f5f4b] opacity-70" />
          </div>
          <p className="mt-3 text-sm text-ink/70">原图：路人和杂物干扰主体</p>
        </div>

        <div className="overflow-hidden rounded-[24px] bg-[#d8e7f6] p-3">
          <div className="relative aspect-[4/3] rounded-[18px] bg-[linear-gradient(180deg,#6cc6dd_0%,#d8efe5_38%,#dcb996_39%,#d1b08c_100%)]">
            <div className="absolute left-[20%] top-[22%] h-32 w-20 rounded-full bg-[#17324a]" />
            <div className="absolute left-[17%] top-[40%] h-36 w-28 rounded-[50px] bg-[#f97352]" />
            <div className="absolute right-[14%] top-[33%] h-36 w-28 rounded-[32px] bg-[rgba(217,185,143,0.65)] blur-lg" />
          </div>
          <p className="mt-3 text-sm text-ink/70">处理后：保留主体并自然补全背景</p>
        </div>
      </div>
    </div>
  );
}
