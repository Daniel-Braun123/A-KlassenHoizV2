import type { BeforeSend } from "@vercel/analytics";

import { sanitizeSpeedInsightUrl } from "./speed-insights";

export const sanitizeWebAnalyticsEvent: BeforeSend = (event) => {
  if (event.type !== "pageview") return null;
  return { ...event, url: sanitizeSpeedInsightUrl(event.url) };
};
