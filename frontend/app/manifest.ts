import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpineCare AI｜脊椎肿瘤复查助手",
    short_name: "SpineCare AI",
    description: "用于脊椎肿瘤患者复查提醒、报告解析、症状问诊和风险提示的 PWA 应用。",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdfa",
    theme_color: "#dceeff",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
