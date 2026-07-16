import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture } from "../../helpers/fixtures";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");
const client = (storageKey: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, storageKey } });

describe("prediction save contract", () => {
  it("speichert mehrere Tipps gemeinsam und rollt bei einem Fehler vollständig zurück", async () => {
    const fixture = await createPredictionFixture(2);
    const first = client(`batch-save-${crypto.randomUUID()}`);
    await first.auth.signInWithPassword({
      email: "owner@example.test",
      password: "LocalFixture42!",
    });

    const invalid = await first.schema("api").rpc("save_predictions_batch", {
      p_round_id: fixture.roundId,
      p_predictions: [
        {
          matchId: fixture.matches[0]!.id,
          homeGoals: 2,
          awayGoals: 1,
          idempotencyKey: crypto.randomUUID(),
        },
        {
          matchId: fixture.matches[1]!.id,
          homeGoals: 100,
          awayGoals: 0,
          idempotencyKey: crypto.randomUUID(),
        },
      ],
    });
    expect(invalid.error?.code).toBe("22023");

    const afterFailure = await first
      .schema("api")
      .from("matchday_prediction_sheet")
      .select("predicted_home_goals,predicted_away_goals")
      .eq("round_id", fixture.roundId);
    expect(afterFailure.data).toEqual([
      { predicted_away_goals: null, predicted_home_goals: null },
      { predicted_away_goals: null, predicted_home_goals: null },
    ]);

    const saved = await first.schema("api").rpc("save_predictions_batch", {
      p_round_id: fixture.roundId,
      p_predictions: fixture.matches.map((match, index) => ({
        matchId: match.id,
        homeGoals: index + 1,
        awayGoals: index,
        idempotencyKey: crypto.randomUUID(),
      })),
    });
    expect(saved.error).toBeNull();
    expect(saved.data?.[0]?.saved_count).toBe(2);
  });

  it("serializes concurrent clients, replays idempotently and honors changed kickoff", async () => {
    const fixture = await createPredictionFixture(1, 5_000);
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
    const waitUntilKickoff = Math.max(0, new Date(match.kickoffAt).getTime() - Date.now() + 100);
    await new Promise((resolve) => window.setTimeout(resolve, waitUntilKickoff));
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
