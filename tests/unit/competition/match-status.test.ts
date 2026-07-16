import { describe, expect, it } from "vitest";

import { getMatchDisplayStatus } from "@/components/predictions/match-status";

const kickoff = "2026-08-15T13:00:00.000Z";
const kickoffTime = new Date(kickoff).getTime();

describe("getMatchDisplayStatus", () => {
  it("wechselt ohne Ergebnis von geplant über LIVE zu Ergebnis fehlt", () => {
    expect(
      getMatchDisplayStatus({
        status: "published",
        kickoffAt: kickoff,
        now: kickoffTime - 1,
      }),
    ).toBe("scheduled");
    expect(
      getMatchDisplayStatus({ status: "published", kickoffAt: kickoff, now: kickoffTime }),
    ).toBe("live");
    expect(
      getMatchDisplayStatus({
        status: "published",
        kickoffAt: kickoff,
        now: kickoffTime + 90 * 60 * 1000 - 1,
      }),
    ).toBe("live");
    expect(
      getMatchDisplayStatus({
        status: "published",
        kickoffAt: kickoff,
        now: kickoffTime + 90 * 60 * 1000,
      }),
    ).toBe("result_missing");
  });

  it("zeigt ein gespeichertes Ergebnis als beendet", () => {
    expect(
      getMatchDisplayStatus({
        status: "published",
        kickoffAt: kickoff,
        decision: "official",
        now: kickoffTime + 30 * 60 * 1000,
      }),
    ).toBe("completed");
  });

  it.each(["postponed", "cancelled", "abandoned"] as const)(
    "behält den Sonderstatus %s bei",
    (status) => {
      expect(
        getMatchDisplayStatus({ status, kickoffAt: kickoff, now: kickoffTime + 30 * 60 * 1000 }),
      ).toBe(status);
    },
  );
});
