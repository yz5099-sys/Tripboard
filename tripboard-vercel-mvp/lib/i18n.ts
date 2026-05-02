export type Lang = "en" | "zh";

export const translations = {
  en: {
    appTitle: "TripBoard",
    appSubtitle: "Collaborative AI travel planner",
    language: "Language",
    country: "Country *",
    region: "Region / State *",
    city: "City",
    area: "Area",
    startDate: "Start date *",
    endDate: "End date *",
    travelers: "Travelers",
    generate: "Generate suggestions",
    copyLink: "Copy share link",
    copied: "Copied!",
    schedule: "Schedule",
    suggestions: "AI Place Suggestions",
    day: "Day",
    notes: "Notes",
    delete: "Delete",
    duplicate: "Duplicate",
    aiRating: "AI estimate",
    duration: "Duration",
    minutes: "min",
    conflict: "Time conflict",
    emptyHint: "Drag place cards here to build your day.",
    mockNotice: "MVP uses mock AI suggestions and local auto-save. Replace API/storage later for production.",
    addManual: "Add manual block"
  },
  zh: {
    appTitle: "TripBoard",
    appSubtitle: "多人协作 AI 旅行计划",
    language: "语言",
    country: "国家 *",
    region: "省份 / 州 *",
    city: "城市",
    area: "地区",
    startDate: "开始日期 *",
    endDate: "结束日期 *",
    travelers: "人数",
    generate: "生成景点推荐",
    copyLink: "复制分享链接",
    copied: "已复制！",
    schedule: "时间块日程表",
    suggestions: "AI 景点推荐",
    day: "第",
    notes: "备注",
    delete: "删除",
    duplicate: "复制",
    aiRating: "AI 参考评分",
    duration: "时长",
    minutes: "分钟",
    conflict: "时间冲突",
    emptyHint: "把下方景点卡片拖到这里安排当天行程。",
    mockNotice: "MVP 使用模拟 AI 推荐与本地自动保存，正式版可替换为真实 API / 数据库。",
    addManual: "新增手动行程"
  }
} as const;

export function t(lang: Lang, key: keyof typeof translations.en) {
  return translations[lang][key] ?? translations.en[key];
}
