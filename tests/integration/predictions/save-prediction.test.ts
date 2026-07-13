import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture, updateFixtureMatch } from "../../helpers/fixtures";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");
const client = (storageKey: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, storageKey } });

describe("prediction save contract", () => {
  it("serializes concurrent clients, replays idempotently and honors changed kickoff", async () => {
    const fixture = await createPredictionFixture(1);
    const match = fixture.matches[0]!;
    const first = client(`save-first-${crypto.randomUUID()}`);
    const second = client(`save-second-${crypto.randomUUID()}`);
    await Promise.all([
      first.auth.signInWithPassword({ email: "owner@example.test", password: "LocalFixture42!" }),
      second.auth.signInWithPassword({ email: "owner@example.test", password: "LocalFixture42!" }),
    ]);
    const replayKey = crypto.randomUUID();
    const saved = await first.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: 2,
      p_away_goals: 1,
      p_idempotency_key: replayKey,
    });
    const replay = await first.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: 9,
      p_away_goals: 9,
      p_idempotency_key: replayKey,
    });
    expect(saved.error).toBeNull();
    expect(replay.data).toEqual(saved.data);
    const concurrent = await Promise.all([
      first.schema("api").rpc("save_prediction", {
        p_round_id: fixture.roundId,
        p_match_id: match.id,
        p_home_goals: 3,
        p_away_goals: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      second.schema("api").rpc("save_prediction", {
        p_round_id: fixture.roundId,
        p_match_id: match.id,
        p_home_goals: 1,
        p_away_goals: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(concurrent.every((result) => result.error === null)).toBe(true);
    const sheet = await first
      .schema("api")
      .from("matchday_prediction_sheet")
      .select("predicted_home_goals,predicted_away_goals")
      .eq("round_id", fixture.roundId)
      .eq("match_id", match.id)
      .single();
    expect([
      [3, 1],
      [1, 0],
    ]).toContainEqual([sheet.data?.predicted_home_goals, sheet.data?.predicted_away_goals]);
    await updateFixtureMatch(
      match,
      fixture.matchdayId,
      "published",
      new Date(Date.now() - 1_000).toISOString(),
    );
    const late = await first.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: 4,
      p_away_goals: 2,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(late.error?.code).toBe("P0001");
  }, 30_000);
});
