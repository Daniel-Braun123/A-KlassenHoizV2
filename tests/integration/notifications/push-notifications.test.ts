import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { berlinDateKey } from "@/features/competition/schedule-display";
import { createPredictionFixture } from "../../helpers/fixtures";
import { finishMatchForLocalTest } from "../../helpers/local-database";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (!url || !key || !secret) throw new Error("Local Supabase test environment missing.");

const client = (name: string, token = key) =>
  createClient<Database>(url, token, {
    auth: { persistSession: false, storageKey: `push-${name}-${crypto.randomUUID()}` },
  });

describe("push notification contract", () => {
  it("allows an existing browser endpoint to reconnect after logout and login", async () => {
    const owner = client("reconnect-owner");
    const credentials = {
      email: "owner@example.test",
      password: "LocalFixture42!",
    };
    expect((await owner.auth.signInWithPassword(credentials)).error).toBeNull();

    const endpoint = `https://push.example.test/${crypto.randomUUID()}`;
    const subscription = {
      p_endpoint: endpoint,
      p_p256dh_key: "p256dh_key_fixture_value_0123456789",
      p_auth_secret: "auth_secret_fixture",
      p_user_agent: "Reconnect integration test",
    };
    expect(
      (await owner.schema("api").rpc("upsert_my_push_subscription", subscription)).error,
    ).toBeNull();

    const detached = await owner
      .schema("api")
      .rpc("remove_my_push_subscription", { p_endpoint: endpoint });
    expect(detached.error).toBeNull();
    expect(detached.data).toBe(true);
    expect(
      (
        await owner
          .schema("api")
          .from("my_push_subscriptions")
          .select("endpoint")
          .eq("endpoint", endpoint)
      ).data,
    ).toEqual([]);

    expect((await owner.auth.signOut()).error).toBeNull();
    expect((await owner.auth.signInWithPassword(credentials)).error).toBeNull();
    expect(
      (await owner.schema("api").rpc("upsert_my_push_subscription", subscription)).error,
    ).toBeNull();
    expect(
      (
        await owner
          .schema("api")
          .from("my_push_subscriptions")
          .select("endpoint")
          .eq("endpoint", endpoint)
      ).data,
    ).toEqual([{ endpoint }]);
  });

  it("isolates devices and claims at most two reminders per matchday", async () => {
    const fixture = await createPredictionFixture(1, 2 * 60 * 60 * 1_000);
    const match = fixture.matches[0]!;
    const owner = client("owner");
    const stranger = client("stranger");
    const scheduler = client("scheduler", secret);
    await Promise.all([
      owner.auth.signInWithPassword({
        email: "owner@example.test",
        password: "LocalFixture42!",
      }),
      stranger.auth.signInWithPassword({
        email: "nonmember@example.test",
        password: "LocalFixture42!",
      }),
    ]);

    const endpoint = `https://push.example.test/${crypto.randomUUID()}`;
    const registered = await owner.schema("api").rpc("upsert_my_push_subscription", {
      p_endpoint: endpoint,
      p_p256dh_key: "p256dh_key_fixture_value_0123456789",
      p_auth_secret: "auth_secret_fixture",
      p_user_agent: "Integration test",
    });
    expect(registered.error).toBeNull();

    const own = await owner
      .schema("api")
      .from("my_push_subscriptions")
      .select("endpoint")
      .eq("endpoint", endpoint);
    expect(own.data).toEqual([{ endpoint }]);
    const foreign = await stranger
      .schema("api")
      .from("my_push_subscriptions")
      .select("endpoint")
      .eq("endpoint", endpoint);
    expect(foreign.data).toEqual([]);

    expect(
      (
        await owner.schema("api").rpc("set_my_push_preferences", {
          p_missing_tips_enabled: false,
        })
      ).error,
    ).toBeNull();
    const earlyNow = new Date(new Date(match.kickoffAt).getTime() - 2 * 60 * 60 * 1_000);
    const paused = await scheduler.schema("api").rpc("claim_due_push_reminders", {
      p_now: earlyNow.toISOString(),
      p_limit: 500,
    });
    expect(paused.error).toBeNull();
    expect(paused.data).toEqual([]);

    await owner.schema("api").rpc("set_my_push_preferences", { p_missing_tips_enabled: true });
    const advance = await scheduler.schema("api").rpc("claim_due_push_reminders", {
      p_now: earlyNow.toISOString(),
      p_limit: 500,
    });
    expect(advance.error).toBeNull();
    const fixtureAdvance = advance.data?.filter(
      (reminder) =>
        reminder.round_id === fixture.roundId &&
        reminder.matchday_id === fixture.matchdayId &&
        reminder.endpoint === endpoint,
    );
    expect(fixtureAdvance).toHaveLength(1);
    expect(fixtureAdvance?.[0]?.kind).toBe("advance_24h");
    expect(fixtureAdvance?.[0]?.missing_count).toBe(1);
    await scheduler.schema("api").rpc("complete_push_delivery", {
      p_delivery_id: fixtureAdvance![0]!.delivery_id,
      p_succeeded: true,
    });
    const duplicate = await scheduler.schema("api").rpc("claim_due_push_reminders", {
      p_now: earlyNow.toISOString(),
      p_limit: 500,
    });
    expect(
      duplicate.data?.filter(
        (reminder) =>
          reminder.round_id === fixture.roundId &&
          reminder.matchday_id === fixture.matchdayId &&
          reminder.endpoint === endpoint,
      ),
    ).toEqual([]);

    const finalNow = new Date(new Date(match.kickoffAt).getTime() - 30 * 60 * 1_000);
    const final = await scheduler.schema("api").rpc("claim_due_push_reminders", {
      p_now: finalNow.toISOString(),
      p_limit: 500,
    });
    expect(final.error).toBeNull();
    const fixtureFinal = final.data?.filter(
      (reminder) =>
        reminder.round_id === fixture.roundId &&
        reminder.matchday_id === fixture.matchdayId &&
        reminder.endpoint === endpoint,
    );
    expect(fixtureFinal).toHaveLength(1);
    expect(fixtureFinal?.[0]?.kind).toBe("final_60m");
  }, 30_000);

  it("queues one notification for publication and one after complete evaluation", async () => {
    const fixture = await createPredictionFixture(1);
    const match = fixture.matches[0]!;
    const owner = client("event-owner");
    const admin = client("event-admin");
    const scheduler = client("event-scheduler", secret);
    await Promise.all([
      owner.auth.signInWithPassword({
        email: "owner@example.test",
        password: "LocalFixture42!",
      }),
      admin.auth.signInWithPassword({
        email: "app-admin@example.test",
        password: "LocalFixture42!",
      }),
    ]);

    const endpoint = `https://push.example.test/${crypto.randomUUID()}`;
    expect(
      (
        await owner.schema("api").rpc("upsert_my_push_subscription", {
          p_endpoint: endpoint,
          p_p256dh_key: "p256dh_key_fixture_value_0123456789",
          p_auth_secret: "auth_secret_fixture",
          p_user_agent: "Matchday event integration test",
        })
      ).error,
    ).toBeNull();

    const publishedKickoff = new Date(Date.now() + 3 * 86_400_000);
    const publishedMatchday = await admin.schema("api").rpc("create_matchday_auto", {
      p_league_id: fixture.competitionId,
      p_phase: "first_leg",
      p_starts_on: berlinDateKey(publishedKickoff),
      p_ends_on: berlinDateKey(publishedKickoff),
    });
    expect(publishedMatchday.error).toBeNull();
    const publishedMatch = await admin.schema("api").rpc("create_match_simple", {
      p_matchday_id: publishedMatchday.data!,
      p_home_club_id: fixture.clubs[0]!.id,
      p_away_club_id: fixture.clubs[1]!.id,
      p_kickoff_at: publishedKickoff.toISOString(),
    });
    expect(publishedMatch.error).toBeNull();

    const publicationClaim = await scheduler.schema("api").rpc("claim_due_push_events", {
      p_limit: 500,
    });
    expect(publicationClaim.error).toBeNull();
    const publication = publicationClaim.data?.filter(
      (event) =>
        event.round_id === fixture.roundId &&
        event.matchday_id === publishedMatchday.data &&
        event.endpoint === endpoint,
    );
    expect(publication).toHaveLength(1);
    expect(publication?.[0]).toMatchObject({
      kind: "matchday_published",
      matchday_number: 2,
      matchday_points: null,
      overall_rank: null,
    });
    await scheduler.schema("api").rpc("complete_push_delivery", {
      p_delivery_id: publication![0]!.delivery_id,
      p_succeeded: true,
    });

    expect(
      (
        await owner.schema("api").rpc("save_prediction", {
          p_round_id: fixture.roundId,
          p_match_id: match.id,
          p_home_goals: 2,
          p_away_goals: 1,
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).toBeNull();
    finishMatchForLocalTest(match.id);
    const result = await admin.schema("api").rpc("set_match_result", {
      p_match_id: match.id,
      p_expected_match_version: match.version,
      p_expected_revision: 0,
      p_decision: "official",
      p_home_goals: 2,
      p_away_goals: 1,
      p_reason: "Push event integration test",
    });
    expect(result.error).toBeNull();

    const evaluationClaim = await scheduler.schema("api").rpc("claim_due_push_events", {
      p_limit: 500,
    });
    expect(evaluationClaim.error).toBeNull();
    const evaluation = evaluationClaim.data?.filter(
      (event) =>
        event.round_id === fixture.roundId &&
        event.matchday_id === fixture.matchdayId &&
        event.endpoint === endpoint,
    );
    expect(evaluation).toHaveLength(1);
    expect(evaluation?.[0]).toMatchObject({
      kind: "matchday_evaluated",
      matchday_number: 1,
      matchday_points: 4,
      overall_rank: 1,
    });
    await scheduler.schema("api").rpc("complete_push_delivery", {
      p_delivery_id: evaluation![0]!.delivery_id,
      p_succeeded: true,
    });

    const duplicateClaim = await scheduler.schema("api").rpc("claim_due_push_events", {
      p_limit: 500,
    });
    expect(
      duplicateClaim.data?.filter(
        (event) =>
          event.round_id === fixture.roundId &&
          [fixture.matchdayId, publishedMatchday.data].includes(event.matchday_id) &&
          event.endpoint === endpoint,
      ),
    ).toEqual([]);
  }, 30_000);
});
