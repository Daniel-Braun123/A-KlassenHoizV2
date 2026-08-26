import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A-KlassenHoiz – Fußball-Tippspiel mit Freunden",
    short_name: siteConfig.name,
    description: siteConfig.description,
    id: "/",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f4f8f4",
    theme_color: "#087a3d",
    lang: "de",
    categories: ["sports", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tipprunden",
        short_name: "Runden",
        url: "/start",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
