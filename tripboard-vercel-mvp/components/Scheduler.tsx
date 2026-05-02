"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTripStore } from "@/lib/store";
import { END_HOUR, heightFromDuration, PIXELS_PER_STEP, START_HOUR, topFromTime } from "@/lib/time";
import ActivityBlock from "./ActivityBlock";
import { t } from "@/lib/i18n";

export default function Scheduler() {
  const { setNodeRef } = useDroppable({ id: "scheduler-dropzone" });
  const { itinerary, activeDayIndex, language, addManual } = useTripStore();
  const day = itinerary.days[activeDayIndex];
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const gridHeight = ((END_HOUR - START_HOUR) * 60 / 30) * PIXELS_PER_STEP;

  return (
    <div className="flex gap-3">
      <div className="w-16 pt-0 text-right text-xs text-cocoa/60">
        {hours.map(h => (
          <div key={h} style={{ height: PIXELS_PER_STEP * 2 }} className="pr-2">
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div
        ref={setNodeRef}
        className="time-grid-bg relative min-h-[672px] flex-1 rounded-3xl border border-dashed border-sand bg-cream/40"
        style={{ height: gridHeight }}
      >
        {!day?.activities.length && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-cocoa/50">
            {t(language, "emptyHint")}
          </div>
        )}

        <button
          onClick={() => addManual(activeDayIndex)}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs shadow-sm hover:bg-white"
        >
          + {t(language, "addManual")}
        </button>

        {day?.activities.map(activity => (
          <ActivityBlock
            key={activity.id}
            activity={activity}
            style={{
              top: topFromTime(activity.start_time),
              height: heightFromDuration(activity.duration)
            }}
          />
        ))}
      </div>
    </div>
  );
}
