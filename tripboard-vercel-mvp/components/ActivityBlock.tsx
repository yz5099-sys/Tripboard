"use client";

import { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Activity, useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function ActivityBlock({ activity, style }: { activity: Activity; style: CSSProperties }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `activity-${activity.id}`,
    data: { type: "activity", activity }
  });
  const { language, activeDayIndex, resizeActivity, deleteActivity, duplicateActivity } = useTripStore();

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.75 : 1,
    ...style
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="absolute left-3 right-3 z-20 cursor-grab rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5 active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-cocoa">{activity.title}</div>
          <div className="text-xs text-cocoa/60">{activity.start_time} – {activity.end_time} · {activity.duration} {t(language, "minutes")}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); duplicateActivity(activeDayIndex, activity.id); }} className="rounded-full bg-cream px-2 py-1 text-xs">{t(language, "duplicate")}</button>
          <button onClick={(e) => { e.stopPropagation(); deleteActivity(activeDayIndex, activity.id); }} className="rounded-full bg-blush/70 px-2 py-1 text-xs">{t(language, "delete")}</button>
        </div>
      </div>
      <div className="mt-2 flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <select
          className="rounded-xl border border-sand bg-white px-2 py-1 text-xs"
          value={activity.duration}
          onChange={(e) => resizeActivity(activeDayIndex, activity.id, Number(e.target.value))}
        >
          {[30, 60, 90, 120, 150, 180, 240].map(m => <option key={m} value={m}>{m} {t(language, "minutes")}</option>)}
        </select>
      </div>
    </div>
  );
}
