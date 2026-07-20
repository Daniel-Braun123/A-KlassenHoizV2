import { describe, expect, it } from "vitest";

import {
  formatMatchdayOptionLabel,
  formatMatchdayPeriod,
  nearestMatchdayId,
  periodsOverlap,
} from "@/features/competition/matchday-period";

const days = [
  { id: "past", startsOn: "2026-07-10", endsOn: "2026-07-12" },
  { id: "current", startsOn: "2026-07-24", endsOn: "2026-07-26" },
  { id: "future", startsOn: "2026-08-07", endsOn: "2026-08-09" },
];

describe("matchday periods", () => {
  it("formats a compact period for matchday dropdowns", () => {
    expect(formatMatchdayPeriod("2026-07-24", "2026-07-26")).toBe("24.–26.07.26");
    expect(formatMatchdayOptionLabel("Hinrunde · Spieltag 1", "2026-07-24", "2026-07-26")).toBe(
      "Hinrunde · ST 1 · 24.–26.07.26",
    );
  });

  it("selects a matchday containing today", () => {
    expect(nearestMatchdayId(days, undefined, "2026-07-25")).toBe("current");
  });

  it("selects the nearest period and prefers the upcoming one on equal distance", () => {
    expect(nearestMatchdayId(days, undefined, "2026-07-18")).toBe("current");
    expect(
      nearestMatchdayId(
        [
          { id: "past", startsOn: "2026-07-17", endsOn: "2026-07-17" },
          { id: "future", startsOn: "2026-07-19", endsOn: "2026-07-19" },
        ],
        undefined,
        "2026-07-18",
      ),
    ).toBe("future");
  });

  it("keeps an explicit valid selection", () => {
    expect(nearestMatchdayId(days, "past", "2026-07-25")).toBe("past");
  });

  it("detects overlap but treats touching outer dates as separate", () => {
    expect(
      periodsOverlap(
        { startsOn: "2026-07-24", endsOn: "2026-07-26" },
        { startsOn: "2026-07-26", endsOn: "2026-07-28" },
      ),
    ).toBe(true);
    expect(
      periodsOverlap(
        { startsOn: "2026-07-24", endsOn: "2026-07-26" },
        { startsOn: "2026-07-27", endsOn: "2026-07-28" },
      ),
    ).toBe(false);
  });
});
