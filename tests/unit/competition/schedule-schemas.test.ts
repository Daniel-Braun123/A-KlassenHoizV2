import { describe, expect, it } from "vitest";

import {
  createMatchdayAutoSchema,
  createSimpleMatchSchema,
  updateMatchdayPeriodSchema,
  updateSimpleMatchSchema,
} from "@/features/competition/schedule-schemas";

const match = {
  homeClubId: "10000000-0000-4000-8000-000000000001",
  awayClubId: "10000000-0000-4000-8000-000000000002",
  kickoffAt: "2026-08-15T13:00:00.000Z",
};

describe("simplified schedule schemas", () => {
  it("requires an ordered period for create and update", () => {
    expect(
      createMatchdayAutoSchema.safeParse({
        leagueId: "10000000-0000-4000-8000-000000000003",
        phase: "first_leg",
        startsOn: "2026-07-24",
        endsOn: "2026-07-26",
      }).success,
    ).toBe(true);
    expect(
      updateMatchdayPeriodSchema.safeParse({
        id: "10000000-0000-4000-8000-000000000003",
        expectedVersion: 1,
        startsOn: "2026-07-27",
        endsOn: "2026-07-26",
      }).success,
    ).toBe(false);
  });

  it("loads both schemas and validates create and update inputs", () => {
    expect(
      createSimpleMatchSchema.safeParse({
        ...match,
        matchdayId: "10000000-0000-4000-8000-000000000003",
      }).success,
    ).toBe(true);
    expect(
      updateSimpleMatchSchema.safeParse({
        ...match,
        id: "10000000-0000-4000-8000-000000000004",
        expectedVersion: 1,
        status: "published",
      }).success,
    ).toBe(true);
  });

  it("rejects a club playing against itself in both mutations", () => {
    expect(
      createSimpleMatchSchema.safeParse({
        ...match,
        awayClubId: match.homeClubId,
        matchdayId: "10000000-0000-4000-8000-000000000003",
      }).success,
    ).toBe(false);
    expect(
      updateSimpleMatchSchema.safeParse({
        ...match,
        awayClubId: match.homeClubId,
        id: "10000000-0000-4000-8000-000000000004",
        expectedVersion: 1,
        status: "published",
      }).success,
    ).toBe(false);
  });
});
