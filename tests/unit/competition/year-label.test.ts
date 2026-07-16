import { describe, expect, it } from "vitest";

import { currentLeagueYearLabel } from "@/features/competition/year-label";

describe("league year label", () => {
  it("uses the current and following two-digit year", () => {
    expect(currentLeagueYearLabel(new Date(2026, 6, 16))).toBe("26/27");
  });

  it("wraps the following year after 99", () => {
    expect(currentLeagueYearLabel(new Date(2099, 6, 16))).toBe("99/00");
  });
});
