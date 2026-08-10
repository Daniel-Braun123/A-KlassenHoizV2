import { describe, expect, it } from "vitest";

import { buildReminderPayload, buildTestPayload } from "@/features/notifications/push-server";

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
    expect(payload.url).toBe(
      "/rounds/10000000-0000-4000-8000-000000000001/predictions?matchday=20000000-0000-4000-8000-000000000002",
    );
    expect(JSON.stringify(payload)).not.toMatch(/email|nickname|home_goals|away_goals/i);
  });

  it("uses a generic test message", () => {
    expect(buildTestPayload()).toMatchObject({ url: "/profile", tag: "push-test" });
  });
});
