"use client";

import { useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function Header() {
  const { language, setLanguage, itinerary, copied, setCopied } = useTripStore();

  async function copyLink() {
    const url = `${window.location.origin}?itinerary=${itinerary.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <header className="flex flex-col justify-between gap-3 rounded-3xl bg-gradient-to-r from-cream via-white to-blush/60 p-5 shadow-sm md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cocoa">{t(language, "appTitle")}</h1>
        <p className="text-sm text-cocoa/70">{t(language, "appSubtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={copyLink} className="rounded-full bg-cocoa px-4 py-2 text-sm text-white shadow-sm hover:opacity-90">
          {copied ? t(language, "copied") : t(language, "copyLink")}
        </button>
        <div className="rounded-full bg-white p-1 shadow-sm">
          <button onClick={() => setLanguage("en")} className={`rounded-full px-3 py-1 text-sm ${language === "en" ? "bg-sand" : ""}`}>EN</button>
          <button onClick={() => setLanguage("zh")} className={`rounded-full px-3 py-1 text-sm ${language === "zh" ? "bg-sand" : ""}`}>中文</button>
        </div>
      </div>
    </header>
  );
}
