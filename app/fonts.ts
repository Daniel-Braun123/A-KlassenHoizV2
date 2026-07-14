import localFont from "next/font/local";

export const barlow = localFont({
  src: [
    { path: "./fonts/barlow-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-700.woff2", weight: "700", style: "normal" },
  ],
  display: "optional",
  preload: false,
  variable: "--font-barlow",
  fallback: ["Arial", "system-ui", "sans-serif"],
});
