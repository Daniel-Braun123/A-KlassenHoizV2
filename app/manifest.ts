import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A-KlassenHoiz – private Tipprunden",
    short_name: "A-KlassenHoiz",
    description: "Das private Tippspiel für lokale Fußballligen.",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7faf7",
    theme_color: "#006b3c",
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
