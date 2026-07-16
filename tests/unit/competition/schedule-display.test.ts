import { describe, expect, it } from "vitest";

import {
  berlinDateKey,
  berlinDateLabel,
  berlinTimeLabel,
  defaultKickoffInputValue,
} from "@/features/competition/schedule-display";

describe("schedule display in Europe/Berlin", () => {
  it("prefills a new kickoff on the current Berlin date at 15:00", () => {
    expect(defaultKickoffInputValue(new Date("2026-07-15T22:30:00.000Z"))).toBe("2026-07-16T15:00");
  });

  it("formats the grouping date and match time in Berlin", () => {
    const kickoff = "2026-07-24T22:30:00.000Z";

    expect(berlinDateKey(kickoff)).toBe("2026-07-25");
    expect(berlinDateLabel(kickoff)).toBe("25.07.2026");
    expect(berlinTimeLabel(kickoff)).toBe("00:30 Uhr");
  });
});
