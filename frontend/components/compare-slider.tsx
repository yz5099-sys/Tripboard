"use client";

import { useState } from "react";

type CompareSliderProps = {
  beforeSrc: string;
  afterSrc: string;
};

export function CompareSlider({ beforeSrc, afterSrc }: CompareSliderProps) {
  const [position, setPosition] = useState(58);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/60 shadow-panel">
        <img
          src={beforeSrc}
          alt="原图"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={afterSrc}
            alt="处理后"
            className="h-full w-full object-cover"
          />
        </div>
        <div
          className="absolute inset-y-0 z-10 w-1 bg-white/90 shadow-[0_0_0_1px_rgba(16,42,67,0.08)]"
          style={{ left: `calc(${position}% - 2px)` }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink shadow-lg">
            对比
          </div>
        </div>
        <div className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ink">
          原图
        </div>
        <div className="absolute right-5 top-5 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
          处理后
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="h-2 w-full cursor-ew-resize appearance-none rounded-full bg-white/80 accent-[#FF6B3D]"
        aria-label="前后对比滑块"
      />
    </div>
  );
}
