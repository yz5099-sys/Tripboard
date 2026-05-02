"use client";

import { useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function DayTabs() {
  const { language, itinerary, activeDayIndex, setActiveDay } = useTripStore();

  return (
    <div className="flex max-w-full gap-2 overflow-x-auto">
      {itinerary.days.map((day, i) => (
        <button
          key={day.date}
          onClick={() => setActiveDay(i)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${activeDayIndex === i ? "bg-cocoa text-white" : "bg-cream text-cocoa"}`}
        >
          {language === "zh" ? `${t(language, "day")} ${i + 1} 天` : `${t(language, "day")} ${i + 1}`} · {day.date.slice(5)}
        </button>
      ))}
    </div>
  );
}
