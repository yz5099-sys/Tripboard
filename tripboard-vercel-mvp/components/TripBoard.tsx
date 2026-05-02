"use client";

import { useEffect } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import Header from "./Header";
import TripConfig from "./TripConfig";
import DayTabs from "./DayTabs";
import Scheduler from "./Scheduler";
import SuggestionsPanel from "./SuggestionsPanel";
import { timeFromTop, snap, minutesFromTime, timeFromMinutes } from "@/lib/time";

export default function TripBoard() {
  const { language, itinerary, suggestions, setSuggestions, addActivity, moveActivity, activeDayIndex } = useTripStore();

  useEffect(() => {
    const saved = localStorage.getItem("tripboard-mvp");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.itinerary) useTripStore.setState(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tripboard-mvp", JSON.stringify(useTripStore.getState()));
    const channel = new BroadcastChannel("tripboard-mvp");
    channel.postMessage({ type: "update", state: useTripStore.getState() });
    return () => channel.close();
  }, [itinerary, suggestions, language]);

  useEffect(() => {
    const channel = new BroadcastChannel("tripboard-mvp");
    channel.onmessage = (event) => {
      if (event.data?.type === "update") {
        // Simulated same-device collaboration; replace with WebSocket for production.
      }
    };
    return () => channel.close();
  }, []);

  async function refreshSuggestions() {
    const dest = itinerary.destinations[0];
    const res = await fetch("/api/suggestions", {
      method: "POST",
      body: JSON.stringify({ ...dest, start_date: itinerary.start_date, end_date: itinerary.end_date })
    });
    const data = await res.json();
    setSuggestions(data.suggestions);
  }

  useEffect(() => {
    refreshSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as any;
    const over = event.over;
    if (!over) return;

    if (over.id === "scheduler-dropzone") {
      const rect = over.rect;
      const y = event.activatorEvent instanceof MouseEvent ? event.activatorEvent.clientY : 0;
      const currentY = event.delta.y + y - rect.top;
      const start = timeFromTop(Math.max(0, currentY));
      const snapped = timeFromMinutes(snap(minutesFromTime(start)));

      if (data?.type === "place") addActivity(activeDayIndex, data.place, snapped);
      if (data?.type === "activity") moveActivity(activeDayIndex, data.activity.id, snapped);
    }
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <main className="min-h-screen bg-[#faf6ee] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Header />
          <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
            <TripConfig onRefresh={refreshSuggestions} />
          </div>
          <section className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t(language, "schedule")}</h2>
              <DayTabs />
            </div>
            <Scheduler />
          </section>
          <section className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
            <SuggestionsPanel onRefresh={refreshSuggestions} />
          </section>
          <p className="pb-6 text-center text-xs text-cocoa/60">{t(language, "mockNotice")}</p>
        </div>
      </main>
    </DndContext>
  );
}
