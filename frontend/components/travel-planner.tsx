"use client";

import {
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { fetchTravelSuggestions } from "@/lib/api";

type Language = "en" | "zh";
type LocalizedText = Record<Language, string>;
type Destination = {
  country: string;
  region: string;
  city: string;
};
type Activity = {
  id: string;
  title: LocalizedText;
  start_time: string;
  end_time: string;
  duration: number;
  source: "suggestion" | "custom";
  placeId: string;
  image: string;
  rating: number;
};
type Day = {
  date: string;
  activities: Activity[];
};
type Itinerary = {
  destination: Destination;
  start_date: string;
  end_date: string;
  travelers: string;
  days: Day[];
};
type PlaceCardData = {
  id: string;
  name: LocalizedText;
  image: string;
  description: LocalizedText;
  duration: number;
  rating: number;
  kind: "popular" | "niche" | "custom";
};
type Interaction = {
  type: "move" | "resize";
  id: string;
  pointerStartY: number;
  originalStartSlot: number;
  originalEndSlot: number;
  currentStartSlot: number;
  currentEndSlot: number;
  invalid: boolean;
};
type DropPreview = {
  slot: number;
  durationSlots: number;
  invalid: boolean;
};
type SyncPayload = {
  clientId: string;
  updatedAt: number;
  itinerary: Itinerary;
  suggestions: PlaceCardData[];
  customPlaces?: PlaceCardData[];
};
type AiStatus = "idle" | "loading" | "ready" | "fallback";

const translations = {
  en: {
    appName: "Tripboard",
    logoMark: "T",
    appSubtitle: "Collaborative travel planner",
    languageEnglish: "EN",
    languageChinese: "中文",
    liveSync: "Live sync",
    saved: "Saved",
    saving: "Saving",
    synced: "Synced",
    shareLink: "Share link",
    copied: "Copied",
    tripConfig: "Trip Config",
    destination: "Destination",
    country: "Country",
    region: "Region",
    city: "City",
    cityOptional: "City optional",
    startDate: "Start date",
    endDate: "End date",
    travelers: "Travelers",
    travelersOptional: "Travelers optional",
    countryPlaceholder: "Japan",
    regionPlaceholder: "Kansai",
    cityPlaceholder: "Kyoto",
    travelersPlaceholder: "2 adults",
    day: "Day",
    scheduler: "Time Scheduler",
    aiSuggestions: "AI Suggestions",
    customPlaces: "Custom Places",
    customSource: "Manual cards",
    popular: "Popular",
    niche: "Niche",
    custom: "Custom",
    addPlace: "Add place",
    editPlace: "Edit place",
    deletePlace: "Delete place",
    removeActivity: "Remove activity",
    resizeActivity: "Resize activity",
    conflict: "Conflict",
    noFreeSlot: "No free slot",
    collaborators: "Shared editing",
    autoSaved: "Auto-saved",
    linkReady: "Link ready",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    dragHandle: "Move activity",
    durationUnit: "min",
    ratingLabel: "Rating",
    suggestionSource: "AI pick",
    aiLoading: "Generating with AI",
    aiReady: "AI suggestions ready",
    aiFallback: "Local suggestions shown",
    refreshAi: "Refresh AI",
    durationEdit: "Edit play time",
    decreaseDuration: "Decrease duration",
    increaseDuration: "Increase duration",
    placeName: "Place name",
    placeNamePlaceholder: "Hidden tea house",
    photoUrl: "Photo URL",
    photoOptional: "Photo optional",
    photoUrlPlaceholder: "https://example.com/photo.jpg",
    description: "Description",
    descriptionOptional: "Description optional",
    descriptionPlaceholder: "A quiet stop for a slower afternoon.",
    createCard: "Create card",
    saveCard: "Save card",
    cancelEdit: "Cancel",
    noCustomPlaces: "Create a place card to schedule it.",
    required: "Required",
    scheduleEmpty: "Drop a place into the day",
    tripLink: "Trip link"
  },
  zh: {
    appName: "Tripboard",
    logoMark: "T",
    appSubtitle: "协作旅行规划",
    languageEnglish: "EN",
    languageChinese: "中文",
    liveSync: "实时同步",
    saved: "已保存",
    saving: "保存中",
    synced: "已同步",
    shareLink: "分享链接",
    copied: "已复制",
    tripConfig: "行程设置",
    destination: "目的地",
    country: "国家",
    region: "地区",
    city: "城市",
    cityOptional: "城市可选",
    startDate: "开始日期",
    endDate: "结束日期",
    travelers: "旅行者",
    travelersOptional: "旅行者可选",
    countryPlaceholder: "日本",
    regionPlaceholder: "关西",
    cityPlaceholder: "京都",
    travelersPlaceholder: "2 位成人",
    day: "第",
    scheduler: "时间排程",
    aiSuggestions: "AI 推荐",
    customPlaces: "自定义景点",
    customSource: "手动卡片",
    popular: "热门",
    niche: "小众",
    custom: "自定义",
    addPlace: "加入行程",
    editPlace: "编辑景点",
    deletePlace: "删除景点",
    removeActivity: "删除活动",
    resizeActivity: "调整时长",
    conflict: "时间冲突",
    noFreeSlot: "无可用时间",
    collaborators: "共享编辑",
    autoSaved: "自动保存",
    linkReady: "链接可用",
    morning: "上午",
    afternoon: "下午",
    evening: "晚上",
    dragHandle: "移动活动",
    durationUnit: "分钟",
    ratingLabel: "评分",
    suggestionSource: "AI 推荐",
    aiLoading: "AI 正在生成",
    aiReady: "AI 推荐已生成",
    aiFallback: "显示本地推荐",
    refreshAi: "刷新 AI",
    durationEdit: "修改游玩时间",
    decreaseDuration: "减少时长",
    increaseDuration: "增加时长",
    placeName: "景点名字",
    placeNamePlaceholder: "隐秘茶馆",
    photoUrl: "照片链接",
    photoOptional: "照片可选",
    photoUrlPlaceholder: "https://example.com/photo.jpg",
    description: "景点介绍",
    descriptionOptional: "介绍可选",
    descriptionPlaceholder: "适合慢下来休息的安静去处。",
    createCard: "制作卡片",
    saveCard: "保存卡片",
    cancelEdit: "取消",
    noCustomPlaces: "制作一张景点卡片后即可排程。",
    required: "必填",
    scheduleEmpty: "把地点拖入当天行程",
    tripLink: "行程链接"
  }
} as const;

type TranslationKey = keyof typeof translations.en;

const DAY_START_MINUTES = 6 * 60;
const DAY_END_MINUTES = 24 * 60;
const SLOT_MINUTES = 30;
const SLOT_COUNT = (DAY_END_MINUTES - DAY_START_MINUTES) / SLOT_MINUTES;
const SLOT_HEIGHT = 44;
const GRID_HEIGHT = SLOT_COUNT * SLOT_HEIGHT;
const STORAGE_PREFIX = "travel-planner-itinerary";
const DURATION_OPTIONS = Array.from({ length: SLOT_COUNT }, (_, index) => (index + 1) * SLOT_MINUTES);
const DRAG_SCROLL_EDGE = 118;
const DRAG_SCROLL_MAX_STEP = 32;

const imageLibrary = [
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=640&q=80"
];

const suggestionBlueprints = [
  {
    id: "landmark-loop",
    kind: "popular" as const,
    duration: 90,
    rating: 4.8,
    name: {
      en: (place: string) => `${place} landmark loop`,
      zh: (place: string) => `${place}地标漫步`
    },
    description: {
      en: "A compact route through the most recognizable sights with room for photos and a relaxed coffee stop.",
      zh: "串联最具代表性的景点，留出拍照和轻松喝咖啡的时间。"
    }
  },
  {
    id: "old-town-walk",
    kind: "popular" as const,
    duration: 120,
    rating: 4.7,
    name: {
      en: (place: string) => `${place} old town walk`,
      zh: (place: string) => `${place}老城散步`
    },
    description: {
      en: "Historic lanes, small shops, and local textures that make the destination feel tangible fast.",
      zh: "老街、小店与本地生活细节，让目的地很快变得真实可感。"
    }
  },
  {
    id: "food-market",
    kind: "popular" as const,
    duration: 90,
    rating: 4.9,
    name: {
      en: (place: string) => `${place} food market`,
      zh: (place: string) => `${place}美食市场`
    },
    description: {
      en: "A high-energy tasting stop with classic bites, seasonal snacks, and easy backup options.",
      zh: "热闹的试吃路线，包含经典小吃、季节点心和灵活备选。"
    }
  },
  {
    id: "museum-quarter",
    kind: "popular" as const,
    duration: 120,
    rating: 4.6,
    name: {
      en: (place: string) => `${place} museum quarter`,
      zh: (place: string) => `${place}博物馆街区`
    },
    description: {
      en: "A culture-heavy block with galleries, calm courtyards, and reliable bad-weather coverage.",
      zh: "文化密度高的街区，有展馆、安静庭院，也适合雨天安排。"
    }
  },
  {
    id: "riverside-sunset",
    kind: "popular" as const,
    duration: 60,
    rating: 4.7,
    name: {
      en: (place: string) => `${place} riverside sunset`,
      zh: (place: string) => `${place}河畔日落`
    },
    description: {
      en: "A scenic late-day pause near water, good for slower pacing before dinner.",
      zh: "靠近水边的傍晚停留点，适合晚餐前放慢节奏。"
    }
  },
  {
    id: "garden-retreat",
    kind: "popular" as const,
    duration: 90,
    rating: 4.8,
    name: {
      en: (place: string) => `${place} garden retreat`,
      zh: (place: string) => `${place}庭园小憩`
    },
    description: {
      en: "Green paths and quiet corners for a reset between busier attractions.",
      zh: "绿意步道和安静角落，适合夹在热门景点之间恢复体力。"
    }
  },
  {
    id: "coffee-lane",
    kind: "niche" as const,
    duration: 60,
    rating: 4.5,
    name: {
      en: (place: string) => `${place} tiny coffee lane`,
      zh: (place: string) => `${place}小咖啡巷`
    },
    description: {
      en: "Independent cafes tucked into side streets, ideal for a softer local rhythm.",
      zh: "藏在支路里的独立咖啡店，适合体验更柔和的本地节奏。"
    }
  },
  {
    id: "design-shops",
    kind: "niche" as const,
    duration: 90,
    rating: 4.4,
    name: {
      en: (place: string) => `${place} indie design shops`,
      zh: (place: string) => `${place}独立设计店`
    },
    description: {
      en: "Small studios, ceramics, stationery, and gifts that feel specific to the neighborhood.",
      zh: "小型工作室、陶器、文具与伴手礼，更能体现街区个性。"
    }
  },
  {
    id: "local-workshop",
    kind: "niche" as const,
    duration: 120,
    rating: 4.6,
    name: {
      en: (place: string) => `${place} local workshop`,
      zh: (place: string) => `${place}手作体验`
    },
    description: {
      en: "A hands-on craft session that turns the itinerary into something more personal.",
      zh: "亲手参与的工艺体验，让行程更有个人记忆点。"
    }
  },
  {
    id: "dawn-photo",
    kind: "niche" as const,
    duration: 60,
    rating: 4.5,
    name: {
      en: (place: string) => `${place} dawn photo spot`,
      zh: (place: string) => `${place}晨光拍摄点`
    },
    description: {
      en: "A quieter viewpoint for early light, clean streets, and fewer crowds.",
      zh: "适合清晨光线的安静视角，街道清爽，人也更少。"
    }
  },
  {
    id: "book-cafe",
    kind: "niche" as const,
    duration: 90,
    rating: 4.3,
    name: {
      en: (place: string) => `${place} book cafe`,
      zh: (place: string) => `${place}书店咖啡`
    },
    description: {
      en: "A low-key stop for browsing shelves, journaling, and planning the next block.",
      zh: "低调的书香停留点，适合翻书、记录和调整下一段安排。"
    }
  },
  {
    id: "night-snacks",
    kind: "niche" as const,
    duration: 90,
    rating: 4.6,
    name: {
      en: (place: string) => `${place} night snack crawl`,
      zh: (place: string) => `${place}夜宵小巡游`
    },
    description: {
      en: "A casual evening route built around local bites and short walks.",
      zh: "围绕本地小吃和短距离散步设计的轻松夜间路线。"
    }
  },
  {
    id: "transit-neighborhood",
    kind: "niche" as const,
    duration: 90,
    rating: 4.2,
    name: {
      en: (place: string) => `${place} transit neighborhood`,
      zh: (place: string) => `${place}站前街区`
    },
    description: {
      en: "Everyday streets near a useful transit hub, good when the day needs flexibility.",
      zh: "靠近交通节点的日常街道，适合需要弹性安排的日子。"
    }
  },
  {
    id: "tea-break",
    kind: "niche" as const,
    duration: 60,
    rating: 4.4,
    name: {
      en: (place: string) => `${place} tea break`,
      zh: (place: string) => `${place}茶点休息`
    },
    description: {
      en: "A calm tasting pause with enough structure to anchor an open afternoon.",
      zh: "安静的品茶停留点，能为开放的下午提供节奏锚点。"
    }
  },
  {
    id: "architecture-walk",
    kind: "niche" as const,
    duration: 120,
    rating: 4.5,
    name: {
      en: (place: string) => `${place} architecture walk`,
      zh: (place: string) => `${place}建筑漫游`
    },
    description: {
      en: "A route for facades, details, and quiet corners that reward slow looking.",
      zh: "适合观察立面、细节与安静转角的慢速路线。"
    }
  },
  {
    id: "signature-view",
    kind: "popular" as const,
    duration: 90,
    rating: 4.7,
    name: {
      en: (place: string) => `${place} signature view`,
      zh: (place: string) => `${place}经典眺望`
    },
    description: {
      en: "A reliable viewpoint that helps the whole trip click into place visually.",
      zh: "稳定好看的观景点，让整趟旅行在视觉上串起来。"
    }
  }
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function formatDayLabel(dateValue: string, language: Language) {
  const parsed = parseDateInput(dateValue);
  if (!parsed) {
    return dateValue;
  }
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short"
  }).format(parsed);
}

function generateDays(startDate: string, endDate: string, existingDays: Day[] = []) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end || end < start) {
    return existingDays.length > 0 ? existingDays : [{ date: startDate, activities: [] }];
  }

  const existingByDate = new Map(existingDays.map((day) => [day.date, day.activities]));
  const days: Day[] = [];
  const cursor = new Date(start);
  const maxDays = 14;

  while (cursor <= end && days.length < maxDays) {
    const date = formatDateInput(cursor);
    days.push({ date, activities: existingByDate.get(date) ?? [] });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function createInitialItinerary(): Itinerary {
  const start = todayOffset(4);
  const end = todayOffset(6);
  return {
    destination: {
      country: "Japan",
      region: "Kansai",
      city: "Kyoto"
    },
    start_date: start,
    end_date: end,
    travelers: "2",
    days: generateDays(start, end)
  };
}

function destinationLabel(destination: Destination, language: Language) {
  const place = destination.city || destination.region || destination.country;
  if (place.trim().length > 0) {
    return place.trim();
  }
  return language === "zh" ? "目的地" : "Destination";
}

function generateSuggestions(destination: Destination): PlaceCardData[] {
  return sortPlaceCards(suggestionBlueprints.map((blueprint, index) => {
    const enPlace = destinationLabel(destination, "en");
    const zhPlace = destinationLabel(destination, "zh");
    return {
      id: `${blueprint.id}-${enPlace.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "trip"}`,
      name: {
        en: blueprint.name.en(enPlace),
        zh: blueprint.name.zh(zhPlace)
      },
      image: imageLibrary[index % imageLibrary.length],
      description: {
        en: blueprint.description.en,
        zh: blueprint.description.zh
      },
      duration: blueprint.duration,
      rating: blueprint.rating,
      kind: blueprint.kind
    };
  }));
}

function sortPlaceCards(places: PlaceCardData[]) {
  return [...places].sort((a, b) => b.rating - a.rating || a.name.en.localeCompare(b.name.en));
}

function dragAutoScroll(clientY: number) {
  if (typeof window === "undefined") {
    return;
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const topDistance = clientY;
  const bottomDistance = viewportHeight - clientY;
  let delta = 0;

  if (topDistance < DRAG_SCROLL_EDGE) {
    delta = -Math.ceil(DRAG_SCROLL_MAX_STEP * (1 - Math.max(topDistance, 0) / DRAG_SCROLL_EDGE));
  } else if (bottomDistance < DRAG_SCROLL_EDGE) {
    delta = Math.ceil(DRAG_SCROLL_MAX_STEP * (1 - Math.max(bottomDistance, 0) / DRAG_SCROLL_EDGE));
  }

  if (delta !== 0) {
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  }
}

function generatedPlaceArt(title: string) {
  const hue = Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const accent = (hue + 42) % 360;
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 42);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 62% 42%)"/>
      <stop offset="1" stop-color="hsl(${accent} 72% 64%)"/>
    </linearGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0v54" fill="none" stroke="white" stroke-opacity=".16" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="640" height="420" fill="url(#bg)"/>
  <rect width="640" height="420" fill="url(#grid)"/>
  <circle cx="520" cy="78" r="92" fill="white" opacity=".18"/>
  <circle cx="98" cy="330" r="130" fill="white" opacity=".11"/>
  <path d="M118 270c82-110 155-148 226-112 63 32 111 10 178-56v214H118z" fill="white" opacity=".22"/>
  <path d="M88 308c98-96 177-122 252-78 67 39 127 27 222-48v138H88z" fill="#0f172a" opacity=".18"/>
  <text x="46" y="72" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" opacity=".86">Tripboard</text>
  <text x="46" y="340" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="800">${safeTitle}</text>
</svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function cardBackgroundImage(image: string, title: string, overlay = "rgba(15,23,42,0.14)") {
  const fallback = generatedPlaceArt(title);
  const safeImage = image && !image.includes("source.unsplash.com") ? image : fallback;
  return `linear-gradient(180deg, rgba(255,255,255,0), ${overlay}), url("${safeImage}"), url("${fallback}")`;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${`${hours}`.padStart(2, "0")}:${`${mins}`.padStart(2, "0")}`;
}

function slotToTime(slot: number) {
  return minutesToTime(DAY_START_MINUTES + slot * SLOT_MINUTES);
}

function timeToSlot(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return Math.round(((hour * 60 + minute) - DAY_START_MINUTES) / SLOT_MINUTES);
}

function durationToSlots(duration: number) {
  return Math.max(1, Math.ceil(duration / SLOT_MINUTES));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hasConflict(
  activities: Activity[],
  startSlot: number,
  endSlot: number,
  ignoreId?: string
) {
  return activities.some((activity) => {
    if (activity.id === ignoreId) {
      return false;
    }
    const activityStart = timeToSlot(activity.start_time);
    const activityEnd = timeToSlot(activity.end_time);
    return startSlot < activityEnd && endSlot > activityStart;
  });
}

function findOpenSlot(
  activities: Activity[],
  preferredSlot: number,
  durationSlots: number,
  ignoreId?: string
) {
  const latestStart = SLOT_COUNT - durationSlots;
  const first = clamp(preferredSlot, 0, latestStart);

  for (let slot = first; slot <= latestStart; slot += 1) {
    if (!hasConflict(activities, slot, slot + durationSlots, ignoreId)) {
      return slot;
    }
  }

  for (let slot = first - 1; slot >= 0; slot -= 1) {
    if (!hasConflict(activities, slot, slot + durationSlots, ignoreId)) {
      return slot;
    }
  }

  return null;
}

function readTripIdFromLocation() {
  const match = window.location.pathname.match(/\/itinerary\/([^/?#]+)/);
  const queryTrip = new URLSearchParams(window.location.search).get("trip");
  return match?.[1] ?? queryTrip;
}

function activityFromPlace(place: PlaceCardData, startSlot: number): Activity {
  const durationSlots = durationToSlots(place.duration);
  const endSlot = startSlot + durationSlots;
  return {
    id: makeId("activity"),
    title: place.name,
    start_time: slotToTime(startSlot),
    end_time: slotToTime(endSlot),
    duration: durationSlots * SLOT_MINUTES,
    source: place.kind === "custom" ? "custom" : "suggestion",
    placeId: place.id,
    image: place.image,
    rating: place.rating
  };
}

function updateActivityTiming(activity: Activity, startSlot: number, endSlot: number): Activity {
  return {
    ...activity,
    start_time: slotToTime(startSlot),
    end_time: slotToTime(endSlot),
    duration: (endSlot - startSlot) * SLOT_MINUTES
  };
}

export function TravelPlanner() {
  const initialItinerary = useMemo(() => createInitialItinerary(), []);
  const [language, setLanguage] = useState<Language>("en");
  const [tripId, setTripId] = useState("draft");
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [suggestions, setSuggestions] = useState<PlaceCardData[]>(
    () => generateSuggestions(initialItinerary.destination)
  );
  const [customPlaces, setCustomPlaces] = useState<PlaceCardData[]>([]);
  const [activeDayDate, setActiveDayDate] = useState(initialItinerary.days[0]?.date ?? "");
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "synced">("saved");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [draggingPlaceId, setDraggingPlaceId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef(makeId("client"));
  const suppressBroadcastRef = useRef(false);
  const lastAppliedRef = useRef(0);
  const aiRequestRef = useRef(0);
  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
    [language]
  );

  const activeDay = itinerary.days.find((day) => day.date === activeDayDate) ?? itinerary.days[0];
  const schedulablePlaces = useMemo(
    () => [...customPlaces, ...suggestions],
    [customPlaces, suggestions]
  );

  useEffect(() => {
    const id = readTripIdFromLocation() ?? makeId("trip");
    setTripId(id);

    if (!readTripIdFromLocation()) {
      window.history.replaceState(null, "", `/itinerary/${id}`);
    }

    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}:${id}`);
    if (stored) {
      try {
        const payload = JSON.parse(stored) as SyncPayload;
        setItinerary(payload.itinerary);
        setSuggestions(sortPlaceCards(payload.suggestions));
        setCustomPlaces(payload.customPlaces ?? []);
        setActiveDayDate(payload.itinerary.days[0]?.date ?? "");
        lastAppliedRef.current = payload.updatedAt;
      } catch {
        window.localStorage.removeItem(`${STORAGE_PREFIX}:${id}`);
      }
    }

    const storedLanguage = window.localStorage.getItem("travel-planner-language") as Language | null;
    if (storedLanguage === "en" || storedLanguage === "zh") {
      setLanguage(storedLanguage);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    if (ready) {
      window.localStorage.setItem("travel-planner-language", language);
    }
  }, [language, ready]);

  const loadAiSuggestions = useCallback(async () => {
    if (!ready) {
      return;
    }

    if (!itinerary.destination.country.trim() || !itinerary.destination.region.trim()) {
      setSuggestions(generateSuggestions(itinerary.destination));
      setAiStatus("fallback");
      return;
    }

    const requestId = aiRequestRef.current + 1;
    aiRequestRef.current = requestId;
    setAiStatus("loading");
    setAiError(null);

    try {
      const result = await fetchTravelSuggestions({
        destination: itinerary.destination,
        startDate: itinerary.start_date,
        endDate: itinerary.end_date,
        travelers: itinerary.travelers,
        language
      });

      if (requestId !== aiRequestRef.current) {
        return;
      }

      setSuggestions(sortPlaceCards(result.suggestions));
      setAiStatus("ready");
      setAiError(null);
    } catch (error) {
      if (requestId !== aiRequestRef.current) {
        return;
      }

      setSuggestions(generateSuggestions(itinerary.destination));
      setAiStatus("fallback");
      setAiError(error instanceof Error ? error.message : null);
    }
  }, [
    itinerary.destination,
    itinerary.start_date,
    itinerary.end_date,
    itinerary.travelers,
    language,
    ready
  ]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadAiSuggestions();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [loadAiSuggestions, ready]);

  useEffect(() => {
    if (!itinerary.days.some((day) => day.date === activeDayDate)) {
      setActiveDayDate(itinerary.days[0]?.date ?? "");
    }
  }, [activeDayDate, itinerary.days]);

  useEffect(() => {
    if (!ready || tripId === "draft") {
      return;
    }

    const channel = new BroadcastChannel(`${STORAGE_PREFIX}:${tripId}`);
    channelRef.current = channel;

    const applyPayload = (payload: SyncPayload) => {
      if (payload.clientId === clientIdRef.current || payload.updatedAt < lastAppliedRef.current) {
        return;
      }
      suppressBroadcastRef.current = true;
      lastAppliedRef.current = payload.updatedAt;
      setItinerary(payload.itinerary);
      setSuggestions(sortPlaceCards(payload.suggestions));
      setCustomPlaces(payload.customPlaces ?? []);
      setSyncStatus("synced");
      window.setTimeout(() => setSyncStatus("saved"), 700);
    };

    channel.onmessage = (event: MessageEvent<SyncPayload>) => applyPayload(event.data);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== `${STORAGE_PREFIX}:${tripId}` || !event.newValue) {
        return;
      }
      try {
        applyPayload(JSON.parse(event.newValue) as SyncPayload);
      } catch {
        return;
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      channel.close();
      channelRef.current = null;
    };
  }, [ready, tripId]);

  useEffect(() => {
    if (!ready || tripId === "draft") {
      return;
    }

    const updatedAt = Date.now();
    const payload: SyncPayload = {
      clientId: clientIdRef.current,
      updatedAt,
      itinerary,
      suggestions,
      customPlaces
    };
    lastAppliedRef.current = updatedAt;
    window.localStorage.setItem(`${STORAGE_PREFIX}:${tripId}`, JSON.stringify(payload));

    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }

    setSyncStatus("saving");
    channelRef.current?.postMessage(payload);
    const timer = window.setTimeout(() => setSyncStatus("saved"), 450);
    return () => window.clearTimeout(timer);
  }, [itinerary, suggestions, customPlaces, ready, tripId]);

  useEffect(() => {
    if (!draggingPlaceId) {
      return;
    }

    const handleDragOver = (event: globalThis.DragEvent) => {
      dragAutoScroll(event.clientY);
    };
    const clearDragging = () => setDraggingPlaceId(null);

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", clearDragging);
    window.addEventListener("dragend", clearDragging);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", clearDragging);
      window.removeEventListener("dragend", clearDragging);
    };
  }, [draggingPlaceId]);

  const updateDestination = (field: keyof Destination, value: string) => {
    setItinerary((current) => ({
      ...current,
      destination: {
        ...current.destination,
        [field]: value
      }
    }));
  };

  const updateDates = (field: "start_date" | "end_date", value: string) => {
    setItinerary((current) => {
      const nextStart = field === "start_date" ? value : current.start_date;
      const nextEnd = field === "end_date" ? value : current.end_date;
      const safeEnd = parseDateInput(nextEnd) && parseDateInput(nextStart) && parseDateInput(nextEnd)! < parseDateInput(nextStart)!
        ? nextStart
        : nextEnd;

      return {
        ...current,
        start_date: nextStart,
        end_date: safeEnd,
        days: generateDays(nextStart, safeEnd, current.days)
      };
    });
  };

  const addPlaceToDay = (place: PlaceCardData, desiredSlot: number) => {
    if (!activeDay) {
      return false;
    }

    const durationSlots = durationToSlots(place.duration);
    const openSlot = findOpenSlot(activeDay.activities, desiredSlot, durationSlots);
    if (openSlot === null) {
      return false;
    }

    const activity = activityFromPlace(place, openSlot);
    setItinerary((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.date === activeDay.date
          ? {
              ...day,
              activities: [...day.activities, activity].sort(
                (a, b) => timeToSlot(a.start_time) - timeToSlot(b.start_time)
              )
            }
          : day
      )
    }));
    return true;
  };

  const updateActivity = (activityId: string, startSlot: number, endSlot: number) => {
    if (!activeDay) {
      return;
    }
    setItinerary((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.date === activeDay.date
          ? {
              ...day,
              activities: day.activities
                .map((activity) =>
                  activity.id === activityId
                    ? updateActivityTiming(activity, startSlot, endSlot)
                    : activity
                )
                .sort((a, b) => timeToSlot(a.start_time) - timeToSlot(b.start_time))
            }
          : day
      )
    }));
  };

  const changeActivityDuration = (activityId: string, durationMinutes: number) => {
    if (!activeDay) {
      return false;
    }

    const activity = activeDay.activities.find((item) => item.id === activityId);
    if (!activity) {
      return false;
    }

    const startSlot = timeToSlot(activity.start_time);
    const durationSlots = durationToSlots(durationMinutes);
    const endSlot = startSlot + durationSlots;
    if (endSlot > SLOT_COUNT || hasConflict(activeDay.activities, startSlot, endSlot, activityId)) {
      return false;
    }

    updateActivity(activityId, startSlot, endSlot);
    return true;
  };

  const removeActivity = (activityId: string) => {
    if (!activeDay) {
      return;
    }
    setItinerary((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.date === activeDay.date
          ? {
              ...day,
              activities: day.activities.filter((activity) => activity.id !== activityId)
            }
          : day
      )
    }));
  };

  const saveCustomPlace = (place: PlaceCardData) => {
    setCustomPlaces((current) => {
      const exists = current.some((item) => item.id === place.id);
      if (exists) {
        return current.map((item) => (item.id === place.id ? place : item));
      }
      return [place, ...current];
    });
  };

  const deleteCustomPlace = (placeId: string) => {
    setCustomPlaces((current) => current.filter((place) => place.id !== placeId));
  };

  const copyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1400);
    } catch {
      setShareState("idle");
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-[#343331]">
      <Header
        language={language}
        setLanguage={setLanguage}
        syncStatus={syncStatus}
        shareState={shareState}
        onShare={copyShareLink}
        t={t}
      />
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 lg:px-8">
        <TripConfig
          itinerary={itinerary}
          updateDestination={updateDestination}
          updateDates={updateDates}
          setTravelers={(travelers) => setItinerary((current) => ({ ...current, travelers }))}
          t={t}
        />
        <DayTabs
          days={itinerary.days}
          activeDayDate={activeDayDate}
          setActiveDayDate={setActiveDayDate}
          language={language}
          t={t}
        />
        <Scheduler
          day={activeDay}
          language={language}
          suggestions={schedulablePlaces}
          addPlaceToDay={addPlaceToDay}
          updateActivity={updateActivity}
          changeActivityDuration={changeActivityDuration}
          removeActivity={removeActivity}
          t={t}
        />
        <CustomPlacesPanel
          customPlaces={customPlaces}
          language={language}
          onSave={saveCustomPlace}
          onDelete={deleteCustomPlace}
          onQuickAdd={(place) => addPlaceToDay(place, 0)}
          onPlaceDragStart={(place) => setDraggingPlaceId(place.id)}
          onPlaceDragEnd={() => setDraggingPlaceId(null)}
          t={t}
        />
        <SuggestionsPanel
          suggestions={suggestions}
          language={language}
          onQuickAdd={(place) => addPlaceToDay(place, 0)}
          aiStatus={aiStatus}
          aiError={aiError}
          onRefresh={() => void loadAiSuggestions()}
          onPlaceDragStart={(place) => setDraggingPlaceId(place.id)}
          onPlaceDragEnd={() => setDraggingPlaceId(null)}
          t={t}
        />
      </div>
    </main>
  );
}

function Header({
  language,
  setLanguage,
  syncStatus,
  shareState,
  onShare,
  t
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  syncStatus: "saved" | "saving" | "synced";
  shareState: "idle" | "copied";
  onShare: () => void;
  t: (key: TranslationKey) => string;
}) {
  const statusLabel =
    syncStatus === "saving" ? t("saving") : syncStatus === "synced" ? t("synced") : t("saved");

  return (
    <header className="border-b border-[#d8d0c8] bg-[#fffaf3]/95 shadow-[0_1px_0_rgba(111,117,111,0.06)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-3 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8f948b] text-lg font-black text-white shadow-sm">
              {t("logoMark")}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-normal text-[#343331]">{t("appName")}</h1>
              <p className="text-sm font-medium text-[#77736d]">{t("appSubtitle")}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:justify-end">
          <div className="flex items-center gap-2 rounded-lg border border-[#d8d0c8] bg-[#f2e4d6] px-3 py-2 text-sm font-semibold text-[#6f756f]">
            <span className="h-2 w-2 rounded-full bg-[#d8aaa5]" />
            {t("liveSync")} / {statusLabel}
          </div>
          <button
            type="button"
            onClick={onShare}
            className="rounded-lg bg-[#6f756f] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#5f665f]"
          >
            {shareState === "copied" ? t("copied") : t("shareLink")}
          </button>
          <div className="flex rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-1 shadow-sm">
            {(["en", "zh"] as Language[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-black transition ${
                  language === option
                    ? "bg-[#d8aaa5] text-white"
                    : "text-[#77736d] hover:bg-[#f8efe7] hover:text-[#343331]"
                }`}
              >
                {option === "en" ? t("languageEnglish") : t("languageChinese")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function TripConfig({
  itinerary,
  updateDestination,
  updateDates,
  setTravelers,
  t
}: {
  itinerary: Itinerary;
  updateDestination: (field: keyof Destination, value: string) => void;
  updateDates: (field: "start_date" | "end_date", value: string) => void;
  setTravelers: (value: string) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <section className="rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8f948b]">
            {t("destination")}
          </p>
          <h2 className="text-xl font-black text-[#343331]">{t("tripConfig")}</h2>
        </div>
        <div className="rounded-lg bg-[#f3e5bc] px-3 py-2 text-sm font-bold text-[#8a7442]">
          {t("autoSaved")}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field label={t("country")} required>
          <input
            required
            value={itinerary.destination.country}
            onChange={(event) => updateDestination("country", event.target.value)}
            placeholder={t("countryPlaceholder")}
            className="input-shell"
          />
        </Field>
        <Field label={t("region")} required>
          <input
            required
            value={itinerary.destination.region}
            onChange={(event) => updateDestination("region", event.target.value)}
            placeholder={t("regionPlaceholder")}
            className="input-shell"
          />
        </Field>
        <Field label={t("city")} hint={t("cityOptional")}>
          <input
            value={itinerary.destination.city}
            onChange={(event) => updateDestination("city", event.target.value)}
            placeholder={t("cityPlaceholder")}
            className="input-shell"
          />
        </Field>
        <Field label={t("startDate")} required>
          <input
            required
            type="date"
            value={itinerary.start_date}
            onChange={(event) => updateDates("start_date", event.target.value)}
            className="input-shell"
          />
        </Field>
        <Field label={t("endDate")} required>
          <input
            required
            type="date"
            value={itinerary.end_date}
            min={itinerary.start_date}
            onChange={(event) => updateDates("end_date", event.target.value)}
            className="input-shell"
          />
        </Field>
        <Field label={t("travelers")} hint={t("travelersOptional")}>
          <input
            value={itinerary.travelers}
            onChange={(event) => setTravelers(event.target.value)}
            placeholder={t("travelersPlaceholder")}
            className="input-shell"
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#77736d]">
        {label}
        {required ? <span className="text-[#b98580]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs font-medium text-[#9a958e]">{hint}</span> : null}
    </label>
  );
}

function DayTabs({
  days,
  activeDayDate,
  setActiveDayDate,
  language,
  t
}: {
  days: Day[];
  activeDayDate: string;
  setActiveDayDate: (date: string) => void;
  language: Language;
  t: (key: TranslationKey) => string;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-2 shadow-sm">
      {days.map((day, index) => {
        const active = day.date === activeDayDate;
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => setActiveDayDate(day.date)}
            className={`flex min-w-[118px] flex-col rounded-lg px-3 py-2.5 text-left transition sm:min-w-[132px] sm:px-4 sm:py-3 ${
              active
                ? "bg-[#8f948b] text-white shadow-sm"
                : "bg-[#f7f1ea] text-[#6f756f] hover:bg-[#f2e4d6]"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-[0.14em]">
              {t("day")} {index + 1}
            </span>
            <span className="text-sm font-black">{formatDayLabel(day.date, language)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Scheduler({
  day,
  language,
  suggestions,
  addPlaceToDay,
  updateActivity,
  changeActivityDuration,
  removeActivity,
  t
}: {
  day?: Day;
  language: Language;
  suggestions: PlaceCardData[];
  addPlaceToDay: (place: PlaceCardData, desiredSlot: number) => boolean;
  updateActivity: (activityId: string, startSlot: number, endSlot: number) => void;
  changeActivityDuration: (activityId: string, durationMinutes: number) => boolean;
  removeActivity: (activityId: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [dropError, setDropError] = useState(false);
  const [durationErrorId, setDurationErrorId] = useState<string | null>(null);
  const activities = day?.activities ?? [];

  const slotFromClientY = useCallback((clientY: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }
    return clamp(Math.round((clientY - rect.top) / SLOT_HEIGHT), 0, SLOT_COUNT - 1);
  }, []);

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      setInteraction((current) => {
        if (!current) {
          return current;
        }

        const deltaSlots = Math.round((event.clientY - current.pointerStartY) / SLOT_HEIGHT);
        const originalDuration = current.originalEndSlot - current.originalStartSlot;
        let nextStart = current.originalStartSlot;
        let nextEnd = current.originalEndSlot;

        if (current.type === "move") {
          nextStart = clamp(current.originalStartSlot + deltaSlots, 0, SLOT_COUNT - originalDuration);
          nextEnd = nextStart + originalDuration;
        } else {
          nextEnd = clamp(current.originalEndSlot + deltaSlots, current.originalStartSlot + 1, SLOT_COUNT);
        }

        return {
          ...current,
          currentStartSlot: nextStart,
          currentEndSlot: nextEnd,
          invalid: hasConflict(activities, nextStart, nextEnd, current.id)
        };
      });
    };

    const handleUp = () => {
      setInteraction((current) => {
        if (current && !current.invalid) {
          updateActivity(current.id, current.currentStartSlot, current.currentEndSlot);
        } else if (current?.invalid) {
          setDropError(true);
          window.setTimeout(() => setDropError(false), 650);
        }
        return null;
      });
    };

    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);

    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activities, interaction, updateActivity]);

  const beginInteraction = (
    event: ReactPointerEvent,
    activity: Activity,
    type: "move" | "resize"
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const start = timeToSlot(activity.start_time);
    const end = timeToSlot(activity.end_time);
    setInteraction({
      type,
      id: activity.id,
      pointerStartY: event.clientY,
      originalStartSlot: start,
      originalEndSlot: end,
      currentStartSlot: start,
      currentEndSlot: end,
      invalid: false
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dragAutoScroll(event.clientY);
    const placeId = event.dataTransfer.getData("text/plain").replace("place:", "");
    const place = suggestions.find((item) => item.id === placeId);
    if (!place) {
      return;
    }
    const durationSlots = durationToSlots(place.duration);
    const slot = clamp(slotFromClientY(event.clientY), 0, SLOT_COUNT - durationSlots);
    setDropPreview({
      slot,
      durationSlots,
      invalid: hasConflict(activities, slot, slot + durationSlots)
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const placeId = event.dataTransfer.getData("text/plain").replace("place:", "");
    const place = suggestions.find((item) => item.id === placeId);
    setDropPreview(null);
    if (!place) {
      return;
    }
    const durationSlots = durationToSlots(place.duration);
    const slot = clamp(slotFromClientY(event.clientY), 0, SLOT_COUNT - durationSlots);
    const placed = addPlaceToDay(place, slot);
    if (!placed) {
      setDropError(true);
      window.setTimeout(() => setDropError(false), 700);
    }
  };

  const handleDurationChange = (activityId: string, durationMinutes: number) => {
    const changed = changeActivityDuration(activityId, durationMinutes);
    if (!changed) {
      setDropError(true);
      setDurationErrorId(activityId);
      window.setTimeout(() => {
        setDropError(false);
        setDurationErrorId(null);
      }, 800);
    }
  };

  return (
    <section className="rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b98580]">
            {t("collaborators")}
          </p>
          <h2 className="text-xl font-black text-[#343331]">{t("scheduler")}</h2>
        </div>
        <div
          className={`rounded-lg px-3 py-2 text-sm font-black transition ${
            dropError ? "bg-[#f3d6d2] text-[#9a5f5a]" : "bg-[#f3e5bc] text-[#8a7442]"
          }`}
        >
          {dropError ? t("conflict") : t("linkReady")}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#ded4ca]">
        <div className="grid min-w-[520px] grid-cols-[64px_minmax(0,1fr)] sm:min-w-[680px] sm:grid-cols-[76px_minmax(0,1fr)] lg:min-w-[720px] lg:grid-cols-[86px_1fr]">
          <TimeAxis t={t} />
          <TimeGrid
            gridRef={gridRef}
            activities={activities}
            language={language}
            interaction={interaction}
            durationErrorId={durationErrorId}
            dropPreview={dropPreview}
            beginInteraction={beginInteraction}
            changeActivityDuration={handleDurationChange}
            removeActivity={removeActivity}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            clearDropPreview={() => setDropPreview(null)}
            t={t}
          />
        </div>
      </div>
    </section>
  );
}

function TimeAxis({ t }: { t: (key: TranslationKey) => string }) {
  const labels = Array.from({ length: SLOT_COUNT / 2 + 1 }, (_, index) => index * 2);

  return (
    <div
      className="relative border-r border-[#ded4ca] bg-[#f7f1ea]"
      style={{ height: GRID_HEIGHT }}
    >
      {labels.map((slot, index) => {
        const first = index === 0;
        const last = index === labels.length - 1;
        return (
          <div
            key={slot}
            className={`absolute right-3 text-xs font-black text-[#8f948b] ${
              first || last ? "" : "-translate-y-2"
            }`}
            style={{ top: first ? 8 : last ? GRID_HEIGHT - 18 : slot * SLOT_HEIGHT }}
          >
            {slotToTime(slot)}
          </div>
        );
      })}
    </div>
  );
}

function TimeGrid({
  gridRef,
  activities,
  language,
  interaction,
  durationErrorId,
  dropPreview,
  beginInteraction,
  changeActivityDuration,
  removeActivity,
  handleDragOver,
  handleDrop,
  clearDropPreview,
  t
}: {
  gridRef: React.RefObject<HTMLDivElement>;
  activities: Activity[];
  language: Language;
  interaction: Interaction | null;
  durationErrorId: string | null;
  dropPreview: DropPreview | null;
  beginInteraction: (event: ReactPointerEvent, activity: Activity, type: "move" | "resize") => void;
  changeActivityDuration: (activityId: string, durationMinutes: number) => void;
  removeActivity: (activityId: string) => void;
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  clearDropPreview: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div
      ref={gridRef}
      data-testid="time-grid"
      className="relative overflow-hidden bg-[#fffdf8]"
      style={{ height: GRID_HEIGHT }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={clearDropPreview}
    >
      {Array.from({ length: SLOT_COUNT }).map((_, slot) => (
        <div
          key={slot}
          className={`absolute left-0 right-0 border-t ${
            slot % 2 === 0 ? "border-[#ded4ca]" : "border-[#eee5dc]"
          }`}
          style={{ top: slot * SLOT_HEIGHT, height: SLOT_HEIGHT }}
        >
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(111,117,111,0.045)_1px,transparent_1px)] bg-[length:25%_100%]" />
        </div>
      ))}
      {activities.length === 0 ? (
        <div className="absolute left-6 top-6 rounded-lg border border-dashed border-[#d8d0c8] bg-[#fffaf3]/90 px-4 py-3 text-sm font-bold text-[#8f948b]">
          {t("scheduleEmpty")}
        </div>
      ) : null}
      {dropPreview ? (
        <div
          className={`pointer-events-none absolute left-4 right-4 rounded-lg border-2 border-dashed transition ${
            dropPreview.invalid
              ? "border-[#b98580] bg-[#f3d6d2]/70"
              : "border-[#c9a95f] bg-[#f3e5bc]/70"
          }`}
          style={{
            top: dropPreview.slot * SLOT_HEIGHT + 4,
            height: dropPreview.durationSlots * SLOT_HEIGHT - 8
          }}
        />
      ) : null}
      {activities.map((activity) => (
        <ActivityBlock
          key={activity.id}
          activity={activity}
          language={language}
          interaction={interaction?.id === activity.id ? interaction : null}
          forceInvalid={durationErrorId === activity.id}
          beginInteraction={beginInteraction}
          changeActivityDuration={changeActivityDuration}
          removeActivity={removeActivity}
          t={t}
        />
      ))}
    </div>
  );
}

function ActivityBlock({
  activity,
  language,
  interaction,
  forceInvalid,
  beginInteraction,
  changeActivityDuration,
  removeActivity,
  t
}: {
  activity: Activity;
  language: Language;
  interaction: Interaction | null;
  forceInvalid: boolean;
  beginInteraction: (event: ReactPointerEvent, activity: Activity, type: "move" | "resize") => void;
  changeActivityDuration: (activityId: string, durationMinutes: number) => void;
  removeActivity: (activityId: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const startSlot = interaction?.currentStartSlot ?? timeToSlot(activity.start_time);
  const endSlot = interaction?.currentEndSlot ?? timeToSlot(activity.end_time);
  const invalid = (interaction?.invalid ?? false) || forceInvalid;
  const displayDuration = (endSlot - startSlot) * SLOT_MINUTES;
  const top = startSlot * SLOT_HEIGHT + 5;
  const height = (endSlot - startSlot) * SLOT_HEIGHT - 10;
  const maxDuration = (SLOT_COUNT - startSlot) * SLOT_MINUTES;

  const submitDuration = (durationMinutes: number) => {
    const snappedDuration = durationToSlots(durationMinutes) * SLOT_MINUTES;
    changeActivityDuration(activity.id, snappedDuration);
  };

  return (
    <article
      data-testid="activity-block"
      className={`absolute left-2 right-2 rounded-lg border p-2.5 shadow-sm transition sm:left-4 sm:right-4 sm:p-3 ${
        invalid
          ? "z-30 border-[#b98580] bg-[#f8e7e4]"
          : "z-20 border-[#e0c5bd] bg-white hover:border-[#d8aaa5]"
      } ${interaction ? "shadow-lg" : ""}`}
      style={{
        top,
        height,
        minHeight: 34,
        touchAction: "none"
      }}
    >
      <div
        className="flex h-full min-h-0 cursor-grab items-start gap-2 active:cursor-grabbing sm:gap-3"
        onPointerDown={(event) => beginInteraction(event, activity, "move")}
        title={t("dragHandle")}
      >
        <div
          className="hidden h-full w-14 shrink-0 rounded-md bg-cover bg-center sm:block"
          style={{
            backgroundImage: cardBackgroundImage(activity.image, activity.title[language], "rgba(15,23,42,0.18)")
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-[#343331]">
                {activity.title[language]}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-[#77736d] sm:text-xs">
                {slotToTime(startSlot)} - {slotToTime(endSlot)} / {displayDuration} {t("durationUnit")}
              </p>
            </div>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => removeActivity(activity.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-black text-[#9a958e] transition hover:bg-[#f8e7e4] hover:text-[#b98580]"
              title={t("removeActivity")}
              aria-label={t("removeActivity")}
            >
              x
            </button>
          </div>
          <div
            className="mt-2 flex items-center gap-1.5 sm:gap-2"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => submitDuration(displayDuration - SLOT_MINUTES)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ded4ca] bg-[#f7f1ea] text-sm font-black text-[#6f756f] transition hover:border-[#d8aaa5] hover:text-[#b98580] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={displayDuration <= SLOT_MINUTES}
              title={t("decreaseDuration")}
              aria-label={t("decreaseDuration")}
            >
              -
            </button>
            <select
              value={displayDuration}
              onChange={(event) => submitDuration(Number(event.target.value))}
              className="h-7 min-w-0 max-w-[8.5rem] rounded-md border border-[#ded4ca] bg-white px-2 text-xs font-black text-[#6f756f] outline-none transition focus:border-[#d8aaa5] focus:ring-2 focus:ring-[#f3d6d2]"
              title={t("durationEdit")}
              aria-label={t("durationEdit")}
            >
              {DURATION_OPTIONS.filter((duration) => duration <= maxDuration).map((duration) => (
                <option key={duration} value={duration}>
                  {duration} {t("durationUnit")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => submitDuration(displayDuration + SLOT_MINUTES)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ded4ca] bg-[#f7f1ea] text-sm font-black text-[#6f756f] transition hover:border-[#d8aaa5] hover:text-[#b98580] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={displayDuration >= maxDuration}
              title={t("increaseDuration")}
              aria-label={t("increaseDuration")}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        data-testid="resize-handle"
        className={`absolute bottom-0 left-3 right-3 z-40 h-3 cursor-ns-resize rounded-t-md ${
          invalid ? "bg-[#b98580]" : "bg-[#d8aaa5]"
        }`}
        onPointerDown={(event) => beginInteraction(event, activity, "resize")}
        title={t("resizeActivity")}
        aria-label={t("resizeActivity")}
      />
    </article>
  );
}

function CustomPlacesPanel({
  customPlaces,
  language,
  onSave,
  onDelete,
  onQuickAdd,
  onPlaceDragStart,
  onPlaceDragEnd,
  t
}: {
  customPlaces: PlaceCardData[];
  language: Language;
  onSave: (place: PlaceCardData) => void;
  onDelete: (placeId: string) => void;
  onQuickAdd: (place: PlaceCardData) => void;
  onPlaceDragStart: (place: PlaceCardData) => void;
  onPlaceDragEnd: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("90");
  const [rating, setRating] = useState("4.5");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setImage("");
    setDescription("");
    setDuration("90");
    setRating("4.5");
  };

  const beginEdit = (place: PlaceCardData) => {
    setEditingId(place.id);
    setName(place.name[language] || place.name.en);
    setImage(place.image.startsWith("data:image/svg+xml") ? "" : place.image);
    setDescription(place.description[language] || place.description.en);
    setDuration(String(place.duration));
    setRating(String(place.rating));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const nextDuration = clamp(Number(duration) || 90, SLOT_MINUTES, DAY_END_MINUTES - DAY_START_MINUTES);
    const nextRating = clamp(Number(rating) || 4.5, 1, 5);
    onSave({
      id: editingId ?? makeId("custom-place"),
      name: {
        en: trimmedName,
        zh: trimmedName
      },
      image: image.trim(),
      description: {
        en: description.trim(),
        zh: description.trim()
      },
      duration: durationToSlots(nextDuration) * SLOT_MINUTES,
      rating: Math.round(nextRating * 10) / 10,
      kind: "custom"
    });
    resetForm();
  };

  return (
    <section className="rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8f948b]">
            {t("customSource")}
          </p>
          <h2 className="text-xl font-black text-[#343331]">{t("customPlaces")}</h2>
        </div>
        <div className="rounded-lg bg-[#f2e4d6] px-3 py-2 text-sm font-black text-[#6f756f]">
          {customPlaces.length}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.4fr_auto]">
        <Field label={t("placeName")} required>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("placeNamePlaceholder")}
            className="input-shell"
          />
        </Field>
        <Field label={t("photoUrl")} hint={t("photoOptional")}>
          <input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder={t("photoUrlPlaceholder")}
            className="input-shell"
          />
        </Field>
        <Field label={t("description")} hint={t("descriptionOptional")}>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className="input-shell"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[220px]">
          <Field label={t("durationEdit")}>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="input-shell"
            >
              {DURATION_OPTIONS.filter((option) => option <= 360).map((option) => (
                <option key={option} value={option}>
                  {option} {t("durationUnit")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("ratingLabel")}>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="input-shell"
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-2 lg:col-span-2 xl:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-[#8f948b] px-4 py-2 text-sm font-black text-white transition hover:bg-[#6f756f]"
          >
            {editingId ? t("saveCard") : t("createCard")}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-[#ded4ca] bg-white px-4 py-2 text-sm font-black text-[#6f756f] transition hover:border-[#d8aaa5] hover:text-[#343331]"
            >
              {t("cancelEdit")}
            </button>
          ) : null}
        </div>
      </form>

      {customPlaces.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {customPlaces.map((place) => (
            <div key={place.id} className="min-w-0">
              <PlaceCard
                place={place}
                language={language}
                onQuickAdd={onQuickAdd}
                onPlaceDragStart={onPlaceDragStart}
                onPlaceDragEnd={onPlaceDragEnd}
                t={t}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => beginEdit(place)}
                  className="flex-1 rounded-lg border border-[#ded4ca] bg-white px-3 py-2 text-sm font-black text-[#6f756f] transition hover:border-[#d8aaa5] hover:text-[#b98580]"
                >
                  {t("editPlace")}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(place.id)}
                  className="flex-1 rounded-lg border border-[#f3d6d2] bg-[#f8e7e4] px-3 py-2 text-sm font-black text-[#b98580] transition hover:border-[#d8aaa5] hover:bg-[#f3d6d2]"
                >
                  {t("deletePlace")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[#d8d0c8] bg-[#f7f1ea] px-4 py-3 text-sm font-bold text-[#8f948b]">
          {t("noCustomPlaces")}
        </div>
      )}
    </section>
  );
}

function SuggestionsPanel({
  suggestions,
  language,
  onQuickAdd,
  aiStatus,
  aiError,
  onRefresh,
  onPlaceDragStart,
  onPlaceDragEnd,
  t
}: {
  suggestions: PlaceCardData[];
  language: Language;
  onQuickAdd: (place: PlaceCardData) => void;
  aiStatus: AiStatus;
  aiError: string | null;
  onRefresh: () => void;
  onPlaceDragStart: (place: PlaceCardData) => void;
  onPlaceDragEnd: () => void;
  t: (key: TranslationKey) => string;
}) {
  const statusLabel =
    aiStatus === "loading" ? t("aiLoading") : aiStatus === "ready" ? t("aiReady") : t("aiFallback");

  return (
    <section className="rounded-lg border border-[#ded4ca] bg-[#fffdf8] p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9a95f]">
            {t("suggestionSource")}
          </p>
          <h2 className="text-xl font-black text-[#343331]">{t("aiSuggestions")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`rounded-lg px-3 py-2 text-sm font-black ${
              aiStatus === "ready"
                ? "bg-[#f3e5bc] text-[#8a7442]"
                : aiStatus === "loading"
                  ? "bg-[#f2e4d6] text-[#6f756f]"
                  : "bg-[#f8e7e4] text-[#b98580]"
            }`}
            title={aiError ?? statusLabel}
          >
            {statusLabel} / {suggestions.length}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-[#ded4ca] bg-white px-3 py-2 text-sm font-black text-[#6f756f] transition hover:border-[#d8aaa5] hover:text-[#b98580] disabled:cursor-wait disabled:opacity-60"
            disabled={aiStatus === "loading"}
          >
            {t("refreshAi")}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {sortPlaceCards(suggestions).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            language={language}
            onQuickAdd={onQuickAdd}
            onPlaceDragStart={onPlaceDragStart}
            onPlaceDragEnd={onPlaceDragEnd}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

function PlaceCard({
  place,
  language,
  onQuickAdd,
  onPlaceDragStart,
  onPlaceDragEnd,
  t
}: {
  place: PlaceCardData;
  language: Language;
  onQuickAdd: (place: PlaceCardData) => void;
  onPlaceDragStart: (place: PlaceCardData) => void;
  onPlaceDragEnd: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", `place:${place.id}`);
    onPlaceDragStart(place);
  };

  const handleDrag = (event: DragEvent<HTMLElement>) => {
    if (event.clientX !== 0 || event.clientY !== 0) {
      dragAutoScroll(event.clientY);
    }
  };

  return (
    <article
      data-testid="place-card"
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={onPlaceDragEnd}
      onClick={() => setExpanded((current) => !current)}
      className="group cursor-grab select-none overflow-hidden rounded-lg border border-[#ded4ca] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#d8aaa5] hover:shadow-md active:cursor-grabbing"
    >
      <div
        className="h-28 bg-cover bg-center sm:h-32"
        style={{
          backgroundImage: cardBackgroundImage(place.image, place.name[language])
        }}
      />
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
              place.kind === "popular"
                ? "bg-[#f3e5bc] text-[#8a7442]"
                : place.kind === "custom"
                  ? "bg-[#f2e4d6] text-[#6f756f]"
                : "bg-[#f8e7e4] text-[#b98580]"
            }`}
          >
            {place.kind === "popular" ? t("popular") : place.kind === "custom" ? t("custom") : t("niche")}
          </span>
          <span className="text-xs font-black text-[#c9a95f]">
            {place.rating.toFixed(1)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-base font-black leading-tight text-[#343331]">
          {place.name[language]}
        </h3>
        {place.description[language] ? (
          <p className={`mt-2 text-sm leading-6 text-[#77736d] ${expanded ? "" : "line-clamp-2"}`}>
            {place.description[language]}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-black text-[#9a958e]">
            {place.duration} {t("durationUnit")}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickAdd(place);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#6f756f] text-lg font-black leading-none text-white transition hover:bg-[#b98580]"
            title={t("addPlace")}
            aria-label={t("addPlace")}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
