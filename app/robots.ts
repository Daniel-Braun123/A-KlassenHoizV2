import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/invite",
        "/legal",
        "/login",
        "/offline",
        "/password",
        "/profile",
        "/register",
        "/rounds",
        "/start",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
