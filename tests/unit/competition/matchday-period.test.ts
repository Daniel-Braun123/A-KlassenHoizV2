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
  it("formats periods separately and keeps dropdown labels explicit", () => {
    expect(formatMatchdayPeriod("2026-07-24", "2026-07-26")).toBe("24.–26.07.26");
    expect(formatMatchdayOptionLabel("Hinrunde · Spieltag 1")).toBe("Hinrunde · Spieltag 1");
    expect(formatMatchdayOptionLabel("Rückrunde · ST 2")).toBe("Rückrunde · Spieltag 2");
  });

  it("selects a matchday containing today", () => {
    expect(nearestMatchdayId(days, undefined, "2026-07-25")).toBe("current");
  });

  it("selects the next upcoming period instead of a closer completed one", () => {
    expect(nearestMatchdayId(days, undefined, "2026-07-18")).toBe("current");
    expect(
      nearestMatchdayId(
        [
          { id: "past", startsOn: "2026-07-17", endsOn: "2026-07-17" },
          { id: "future", startsOn: "2026-07-25", endsOn: "2026-07-26" },
        ],
        undefined,
        "2026-07-18",
      ),
    ).toBe("future");
  });

  it("falls back to the most recently completed period when no future period exists", () => {
    expect(
      nearestMatchdayId(
        [
          { id: "older", startsOn: "2026-07-01", endsOn: "2026-07-02" },
          { id: "latest", startsOn: "2026-07-10", endsOn: "2026-07-12" },
        ],
        undefined,
        "2026-07-18",
      ),
    ).toBe("latest");
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
