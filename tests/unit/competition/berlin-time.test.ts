import { describe, expect, it } from "vitest";

import { berlinDateTimeLocalToIso } from "@/features/competition/berlin-time";

describe("Europe/Berlin datetime-local conversion", () => {
  it("converts summer and winter kickoff times independent of the server timezone", () => {
    expect(berlinDateTimeLocalToIso("2026-07-21T19:00")).toBe("2026-07-21T17:00:00.000Z");
    expect(berlinDateTimeLocalToIso("2026-12-21T19:00")).toBe("2026-12-21T18:00:00.000Z");
  });

  it("chooses the later standard-time occurrence for an ambiguous autumn time", () => {
    expect(berlinDateTimeLocalToIso("2026-10-25T02:30")).toBe("2026-10-25T01:30:00.000Z");
  });

  it("rejects impossible dates and the spring DST gap", () => {
    expect(() => berlinDateTimeLocalToIso("2026-02-31T19:00")).toThrow(RangeError);
    expect(() => berlinDateTimeLocalToIso("2026-03-29T02:30")).toThrow(RangeError);
  });
});
