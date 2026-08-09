import { describe, expect, it } from "vitest";

import { sanitizeSpeedInsightUrl } from "@/lib/observability/speed-insights";

describe("sanitizeSpeedInsightUrl", () => {
  it("redacts round IDs and removes query parameters from absolute URLs", () => {
    expect(
      sanitizeSpeedInsightUrl(
        "https://a-klassenhoiz.de/rounds/2b89e2d7-56c4-4710-b76f-779312a0fbce/predictions?matchday=secret#tip",
      ),
    ).toBe("https://a-klassenhoiz.de/rounds/[roundId]/predictions");
  });

  it("redacts invitation tokens in relative URLs", () => {
    expect(sanitizeSpeedInsightUrl("/invite/private-token?source=qr")).toBe("/invite/[token]");
  });

  it("redacts league IDs in admin URLs", () => {
    expect(sanitizeSpeedInsightUrl("/admin/competitions/league-id/schedule?tab=results")).toBe(
      "/admin/competitions/[leagueId]/schedule",
    );
  });

  it("keeps public paths while removing parameters and fragments", () => {
    expect(sanitizeSpeedInsightUrl("/login?next=%2Fstart#form")).toBe("/login");
  });

  it("fails closed for malformed URLs", () => {
    expect(sanitizeSpeedInsightUrl("https://%zz")).toBe("/");
  });
});
