"use client";

import { Analytics } from "@vercel/analytics/next";

import { sanitizeWebAnalyticsEvent } from "@/lib/observability/web-analytics";

export function AppAnalytics() {
  return <Analytics beforeSend={sanitizeWebAnalyticsEvent} />;
}
