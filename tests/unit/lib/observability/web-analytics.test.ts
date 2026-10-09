import { describe, expect, it } from "vitest";

import { sanitizeWebAnalyticsEvent } from "@/lib/observability/web-analytics";

describe("Web Analytics privacy boundary", () => {
  it.each([
    ["https://a-klassenhoiz.de/invite/secret-token?next=private#fragment", "/invite/[token]"],
    [
      "https://a-klassenhoiz.de/rounds/private-id/predictions?matchday=secret",
      "/rounds/[roundId]/predictions",
    ],
    [
      "https://a-klassenhoiz.de/admin/competitions/private-id/results",
      "/admin/competitions/[leagueId]/results",
    ],
    ["https://a-klassenhoiz.de/auth/callback?token_hash=secret&code=secret", "/auth/callback"],
    ["https://a-klassenhoiz.de/register?email=private@example.test", "/register"],
    ["https://a-klassenhoiz.de/rounds/new", "/rounds/new"],
  ])("redacts sensitive addresses before sending a page view: %s", (url, path) => {
    expect(sanitizeWebAnalyticsEvent({ type: "pageview", url })).toEqual({
      type: "pageview",
      url: `https://a-klassenhoiz.de${path}`,
    });
  });

  it("drops custom product events", () => {
    expect(
      sanitizeWebAnalyticsEvent({ type: "event", url: "https://a-klassenhoiz.de/profile" }),
    ).toBeNull();
  });
});
