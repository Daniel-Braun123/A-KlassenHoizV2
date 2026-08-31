import { describe, expect, it } from "vitest";

import {
  buildEventPayload,
  buildReminderPayload,
  buildTestPayload,
} from "@/features/notifications/push-server";

describe("push payloads", () => {
  it("contains no profile or prediction details and links to the due matchday", () => {
    const payload = buildReminderPayload({
      kind: "advance_24h",
      matchday_id: "20000000-0000-4000-8000-000000000002",
      missing_count: 3,
      next_kickoff_at: "2026-08-15T13:00:00.000Z",
      round_id: "10000000-0000-4000-8000-000000000001",
    });

    expect(payload.title).toBe("3 Tipps fehlen noch");
    expect(payload.badgeCount).toBe(3);
    expect(payload.url).toBe(
      "/rounds/10000000-0000-4000-8000-000000000001/predictions?matchday=20000000-0000-4000-8000-000000000002",
    );
    expect(JSON.stringify(payload)).not.toMatch(/email|nickname|home_goals|away_goals/i);
  });

  it("uses a generic test message", () => {
    expect(buildTestPayload()).toMatchObject({ url: "/profile", tag: "push-test" });
  });

  it("announces a newly published matchday and links directly to its predictions", () => {
    expect(
      buildEventPayload({
        kind: "matchday_published",
        matchday_id: "20000000-0000-4000-8000-000000000002",
        matchday_number: 4,
        matchday_points: null,
        overall_rank: null,
        round_id: "10000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      title: "Spieltag 4 ist offen",
      body: "In deiner Tipprunde kannst du jetzt deine Tipps abgeben.",
      url: "/rounds/10000000-0000-4000-8000-000000000001/predictions?matchday=20000000-0000-4000-8000-000000000002",
      tag: "matchday-published-10000000-0000-4000-8000-000000000001-20000000-0000-4000-8000-000000000002",
    });
  });

  it("summarizes the personal matchday result and links to the ranking", () => {
    expect(
      buildEventPayload({
        kind: "matchday_evaluated",
        matchday_id: "20000000-0000-4000-8000-000000000002",
        matchday_number: 4,
        matchday_points: 7,
        overall_rank: 2,
        round_id: "10000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      title: "Spieltag 4 ist ausgewertet",
      body: "7 Punkte für dich · aktuell Platz 2 in deiner Tipprunde.",
      url: "/rounds/10000000-0000-4000-8000-000000000001/rankings?matchday=20000000-0000-4000-8000-000000000002",
      tag: "matchday-evaluated-10000000-0000-4000-8000-000000000001-20000000-0000-4000-8000-000000000002",
    });
  });
});
