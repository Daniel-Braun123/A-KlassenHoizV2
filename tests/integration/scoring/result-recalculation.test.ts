import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture } from "../../helpers/fixtures";
import { finishMatchForLocalTest } from "../../helpers/local-database";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");
const client = (name: string) =>
  createClient<Database>(url, key, {
    auth: { persistSession: false, storageKey: `score-${name}-${crypto.randomUUID()}` },
  });

describe("result scoring and recovery", () => {
  it("recalculates two isolated rounds atomically and rebuilds identically", async () => {
    const fixture = await createPredictionFixture(1);
    const match = fixture.matches[0]!;
    const owner = client("owner"),
      member = client("member"),
      admin = client("admin");
    await Promise.all([
      owner.auth.signInWithPassword({ email: "owner@example.test", password: "LocalFixture42!" }),
      member.auth.signInWithPassword({ email: "member@example.test", password: "LocalFixture42!" }),
      admin.auth.signInWithPassword({
        email: "app-admin@example.test",
        password: "LocalFixture42!",
      }),
    ]);
    const secondRound = await member.schema("api").rpc("create_round", {
      p_name: `Zweite Runde ${crypto.randomUUID().slice(0, 6)}`,
      p_league_season_id: fixture.competitionId,
      p_nickname: "Mitglied",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(secondRound.error).toBeNull();
    await owner.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: 2,
      p_away_goals: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    await member.schema("api").rpc("save_prediction", {
      p_round_id: secondRound.data!,
      p_match_id: match.id,
      p_home_goals: 3,
      p_away_goals: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    finishMatchForLocalTest(match.id);
    const firstResult = await admin.schema("api").rpc("set_match_result", {
      p_match_id: match.id,
      p_expected_match_version: 2,
      p_expected_revision: 0,
      p_decision: "official",
      p_home_goals: 2,
      p_away_goals: 1,
      p_reason: "Erster Import",
    });
    expect(firstResult.data?.[0]?.recalculated_count).toBe(2);
    const ownerOutcome = await owner
      .schema("api")
      .from("matchday_prediction_sheet")
      .select(
        "prediction_points,result_decision,result_home_goals,result_away_goals,result_revision_no,result_is_correction",
      )
      .eq("round_id", fixture.roundId)
      .single();
    expect(ownerOutcome.error).toBeNull();
    expect(ownerOutcome.data).toMatchObject({
      prediction_points: 4,
      result_decision: "official",
      result_home_goals: 2,
      result_away_goals: 1,
      result_revision_no: 1,
      result_is_correction: false,
    });
    expect(
      (
        await owner
          .schema("api")
          .from("overall_ranking")
          .select("points")
          .eq("round_id", fixture.roundId)
          .single()
      ).data?.points,
    ).toBe(4);
    expect(
      (
        await member
          .schema("api")
          .from("overall_ranking")
          .select("points")
          .eq("round_id", secondRound.data!)
          .single()
      ).data?.points,
    ).toBe(2);
    const correction = await admin.schema("api").rpc("set_match_result", {
      p_match_id: match.id,
      p_expected_match_version: 3,
      p_expected_revision: 1,
      p_decision: "official",
      p_home_goals: 3,
      p_away_goals: 1,
      p_reason: "Korrektur",
    });
    expect(correction.data?.[0]?.recalculated_count).toBe(2);
    const correctedOutcome = await owner
      .schema("api")
      .from("matchday_prediction_sheet")
      .select(
        "prediction_points,result_decision,result_home_goals,result_away_goals,result_revision_no,result_is_correction",
      )
      .eq("round_id", fixture.roundId)
      .single();
    expect(correctedOutcome.error).toBeNull();
    expect(correctedOutcome.data).toMatchObject({
      prediction_points: 2,
      result_decision: "official",
      result_home_goals: 3,
      result_away_goals: 1,
      result_revision_no: 2,
      result_is_correction: true,
    });
    const before = await owner
      .schema("api")
      .from("overall_ranking")
      .select("membership_id,points,rank")
      .eq("round_id", fixture.roundId);
    expect(before.data?.[0]?.points).toBe(2);
    expect(
      (
        await member
          .schema("api")
          .from("overall_ranking")
          .select("points")
          .eq("round_id", secondRound.data!)
          .single()
      ).data?.points,
    ).toBe(4);
    const rebuild = await admin.schema("api").rpc("rebuild_all_scores");
    expect(rebuild.data).toBeGreaterThanOrEqual(2);
    const after = await owner
      .schema("api")
      .from("overall_ranking")
      .select("membership_id,points,rank")
      .eq("round_id", fixture.roundId);
    expect(after.data).toEqual(before.data);
    const revisions = await admin
      .schema("api")
      .from("schedule")
      .select("revision_no")
      .eq("match_id", match.id)
      .single();
    expect(revisions.data?.revision_no).toBe(2);
  }, 30_000);
});
