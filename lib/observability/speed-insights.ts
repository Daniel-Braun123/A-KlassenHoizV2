import type { BeforeSendMiddleware } from "@vercel/speed-insights";

const telemetryOrigin = "https://telemetry.invalid";

const privatePathSegments: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/invite\/[^/]+/, "/invite/[token]"],
  [/^\/rounds\/[^/]+/, "/rounds/[roundId]"],
  [/^\/admin\/competitions\/[^/]+/, "/admin/competitions/[leagueId]"],
];

export function sanitizeSpeedInsightUrl(value: string): string {
  const isAbsolute = /^https?:\/\//i.test(value);

  try {
    const url = new URL(value, telemetryOrigin);
    const pathname = privatePathSegments.reduce(
      (currentPath, [pattern, replacement]) => currentPath.replace(pattern, replacement),
      url.pathname,
    );

    return isAbsolute ? `${url.origin}${pathname}` : pathname;
  } catch {
    return "/";
  }
}

export const sanitizeSpeedInsightEvent: BeforeSendMiddleware = (event) => ({
  ...event,
  url: sanitizeSpeedInsightUrl(event.url),
});
