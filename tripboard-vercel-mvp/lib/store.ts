import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Lang } from "./i18n";
import { minutesFromTime, timeFromMinutes, START_HOUR, END_HOUR, overlaps } from "./time";

export type Place = {
  id: string;
  name: string;
  image: string;
  description: string;
  duration: number;
  rating: number;
  tags?: string[];
};

export type Activity = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration: number;
  source: "AI" | "manual";
  notes?: string;
};

export type Day = {
  date: string;
  activities: Activity[];
};

export type Itinerary = {
  id: string;
  destinations: {
    country: string;
    region: string;
    city?: string;
    area?: string;
  }[];
  start_date: string;
  end_date: string;
  travelers?: string;
  days: Day[];
};

type Store = {
  language: Lang;
  itinerary: Itinerary;
  activeDayIndex: number;
  suggestions: Place[];
  copied: boolean;
  setLanguage: (lang: Lang) => void;
  setCopied: (value: boolean) => void;
  updateTrip: (patch: Partial<Itinerary> & { country?: string; region?: string; city?: string; area?: string }) => void;
  setActiveDay: (index: number) => void;
  setSuggestions: (places: Place[]) => void;
  addActivity: (dayIndex: number, place: Place, start?: string) => void;
  moveActivity: (dayIndex: number, activityId: string, start: string) => void;
  resizeActivity: (dayIndex: number, activityId: string, duration: number) => void;
  deleteActivity: (dayIndex: number, activityId: string) => void;
  duplicateActivity: (dayIndex: number, activityId: string) => void;
  addManual: (dayIndex: number) => void;
};

function defaultDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function makeDays(start: string, end: string): Day[] {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];
  const days: Day[] = [];
  const cur = new Date(s);
  while (cur <= e) {
    days.push({ date: cur.toISOString().slice(0, 10), activities: [] });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function findSlot(activities: Activity[], duration: number) {
  for (let m = START_HOUR * 60; m + duration <= END_HOUR * 60; m += 30) {
    const st = timeFromMinutes(m);
    const en = timeFromMinutes(m + duration);
    if (!activities.some(a => overlaps(st, en, a.start_time, a.end_time))) return st;
  }
  return timeFromMinutes(START_HOUR * 60);
}

function canPlace(activities: Activity[], id: string, start: string, duration: number) {
  const s = minutesFromTime(start);
  const e = s + duration;
  if (s < START_HOUR * 60 || e > END_HOUR * 60) return false;
  const end = timeFromMinutes(e);
  return !activities.some(a => a.id !== id && overlaps(start, end, a.start_time, a.end_time));
}

const initial: Itinerary = {
  id: nanoid(8),
  destinations: [{ country: "Japan", region: "Tokyo", city: "Tokyo", area: "" }],
  start_date: defaultDate(),
  end_date: defaultDate(2),
  travelers: "2",
  days: makeDays(defaultDate(), defaultDate(2))
};

export const useTripStore = create<Store>((set, get) => ({
  language: "en",
  itinerary: initial,
  activeDayIndex: 0,
  suggestions: [],
  copied: false,

  setLanguage: (language) => set({ language }),
  setCopied: (copied) => set({ copied }),

  updateTrip: (patch) => set((state) => {
    const dest = state.itinerary.destinations[0] ?? { country: "", region: "" };
    const destinations = [{
      ...dest,
      country: patch.country ?? dest.country,
      region: patch.region ?? dest.region,
      city: patch.city ?? dest.city,
      area: patch.area ?? dest.area
    }];

    const start = patch.start_date ?? state.itinerary.start_date;
    const end = patch.end_date ?? state.itinerary.end_date;
    const datesChanged = patch.start_date || patch.end_date;

    return {
      itinerary: {
        ...state.itinerary,
        ...patch,
        destinations,
        days: datesChanged ? makeDays(start, end) : state.itinerary.days
      },
      activeDayIndex: 0
    };
  }),

  setActiveDay: (activeDayIndex) => set({ activeDayIndex }),
  setSuggestions: (suggestions) => set({ suggestions }),

  addActivity: (dayIndex, place, start) => set((state) => {
    const days = [...state.itinerary.days];
    const day = days[dayIndex];
    const duration = place.duration || 90;
    const startTime = start ?? findSlot(day.activities, duration);
    const endTime = timeFromMinutes(minutesFromTime(startTime) + duration);
    if (!canPlace(day.activities, "", startTime, duration)) return state;
    day.activities = [...day.activities, {
      id: nanoid(8),
      title: place.name,
      start_time: startTime,
      end_time: endTime,
      duration,
      source: "AI",
      notes: place.description
    }];
    return { itinerary: { ...state.itinerary, days } };
  }),

  moveActivity: (dayIndex, activityId, start) => set((state) => {
    const days = [...state.itinerary.days];
    const day = days[dayIndex];
    const target = day.activities.find(a => a.id === activityId);
    if (!target || !canPlace(day.activities, activityId, start, target.duration)) return state;
    day.activities = day.activities.map(a => a.id === activityId ? {
      ...a,
      start_time: start,
      end_time: timeFromMinutes(minutesFromTime(start) + a.duration)
    } : a);
    return { itinerary: { ...state.itinerary, days } };
  }),

  resizeActivity: (dayIndex, activityId, duration) => set((state) => {
    const days = [...state.itinerary.days];
    const day = days[dayIndex];
    const target = day.activities.find(a => a.id === activityId);
    const nextDuration = Math.max(30, duration);
    if (!target || !canPlace(day.activities, activityId, target.start_time, nextDuration)) return state;
    day.activities = day.activities.map(a => a.id === activityId ? {
      ...a,
      duration: nextDuration,
      end_time: timeFromMinutes(minutesFromTime(a.start_time) + nextDuration)
    } : a);
    return { itinerary: { ...state.itinerary, days } };
  }),

  deleteActivity: (dayIndex, activityId) => set((state) => {
    const days = [...state.itinerary.days];
    days[dayIndex].activities = days[dayIndex].activities.filter(a => a.id !== activityId);
    return { itinerary: { ...state.itinerary, days } };
  }),

  duplicateActivity: (dayIndex, activityId) => set((state) => {
    const days = [...state.itinerary.days];
    const day = days[dayIndex];
    const target = day.activities.find(a => a.id === activityId);
    if (!target) return state;
    const start = findSlot(day.activities, target.duration);
    const copy = { ...target, id: nanoid(8), start_time: start, end_time: timeFromMinutes(minutesFromTime(start) + target.duration) };
    day.activities = [...day.activities, copy];
    return { itinerary: { ...state.itinerary, days } };
  }),

  addManual: (dayIndex) => {
    const place = { id: "manual", name: "New activity", image: "", description: "", duration: 60, rating: 0 };
    get().addActivity(dayIndex, place);
  }
}));
