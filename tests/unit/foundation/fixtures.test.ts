import { describe, expect, it } from "vitest";

import { fixtureActors, fixtureClock, fixtureCompetition } from "@/tests/fixtures";
import {
  fixedDatabaseClockSql,
  makeDbActor,
  makeMatch,
  makeRound,
  makeSession,
} from "@/tests/fixtures/factories";

describe("deterministic fixtures", () => {
  it("creates stable session and actor identities", () => {
    expect(makeSession().userId).toBe(fixtureActors.member);
    expect(makeDbActor({ appRole: "app_admin" })).toMatchObject({
      userId: fixtureActors.member,
      appRole: "app_admin",
    });
  });

  it("keeps rounds and matches on the same synthetic competition", () => {
    expect(makeRound().leagueSeasonId).toBe(fixtureCompetition.leagueSeasonId);
    expect(makeMatch()).toMatchObject({
      id: fixtureCompetition.matchId,
      kickoffAt: fixtureClock.atKickoff,
    });
  });

  it("normalizes fixed database time and rejects invalid values", () => {
    expect(fixedDatabaseClockSql("2026-08-01T12:00:00+00:00")).toBe(
      "set local app.test_now = '2026-08-01T12:00:00.000Z'",
    );
    expect(() => fixedDatabaseClockSql("not-a-date")).toThrow("ISO timestamp");
  });
});
