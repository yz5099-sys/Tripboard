"use client";

import { useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import PlaceCard from "./PlaceCard";

export default function SuggestionsPanel({ onRefresh }: { onRefresh: () => void }) {
  const { language, suggestions } = useTripStore();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t(language, "suggestions")}</h2>
        <button onClick={onRefresh} className="rounded-full bg-cream px-4 py-2 text-sm hover:bg-sand/70">
          {t(language, "generate")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map(place => <PlaceCard key={place.id} place={place} />)}
      </div>
    </div>
  );
}
