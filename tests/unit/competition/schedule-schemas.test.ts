import { describe, expect, it } from "vitest";

import {
  createSimpleMatchSchema,
  updateSimpleMatchSchema,
} from "@/features/competition/schedule-schemas";

const match = {
  homeClubId: "10000000-0000-4000-8000-000000000001",
  awayClubId: "10000000-0000-4000-8000-000000000002",
  kickoffAt: "2026-08-15T13:00:00.000Z",
};

describe("simplified schedule schemas", () => {
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
