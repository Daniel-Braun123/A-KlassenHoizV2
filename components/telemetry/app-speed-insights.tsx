"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { sanitizeSpeedInsightEvent } from "@/lib/observability/speed-insights";

export function AppSpeedInsights() {
  return <SpeedInsights beforeSend={sanitizeSpeedInsightEvent} />;
}
