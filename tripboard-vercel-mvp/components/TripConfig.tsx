"use client";

import { useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function TripConfig({ onRefresh }: { onRefresh: () => void }) {
  const { language, itinerary, updateTrip } = useTripStore();
  const dest = itinerary.destinations[0];

  const input = "rounded-2xl border border-sand/70 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blush";

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <input className={input} placeholder={t(language, "country")} value={dest.country} onChange={(e) => updateTrip({ country: e.target.value })} />
      <input className={input} placeholder={t(language, "region")} value={dest.region} onChange={(e) => updateTrip({ region: e.target.value })} />
      <input className={input} placeholder={t(language, "city")} value={dest.city ?? ""} onChange={(e) => updateTrip({ city: e.target.value })} />
      <input className={input} placeholder={t(language, "area")} value={dest.area ?? ""} onChange={(e) => updateTrip({ area: e.target.value })} />
      <input className={input} type="date" value={itinerary.start_date} onChange={(e) => updateTrip({ start_date: e.target.value })} />
      <input className={input} type="date" value={itinerary.end_date} onChange={(e) => updateTrip({ end_date: e.target.value })} />
      <input className={input} placeholder={t(language, "travelers")} value={itinerary.travelers ?? ""} onChange={(e) => updateTrip({ travelers: e.target.value })} />
      <button onClick={onRefresh} className="rounded-2xl bg-blush px-4 py-2 font-medium text-cocoa hover:brightness-95">
        {t(language, "generate")}
      </button>
    </div>
  );
}
