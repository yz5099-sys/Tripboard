import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tripboard",
    short_name: "Tripboard",
    description: "A bilingual collaborative travel planner with AI place suggestions and drag-and-drop scheduling.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1ea",
    theme_color: "#d8aaa5",
    lang: "en",
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
