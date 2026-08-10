import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture } from "../../helpers/fixtures";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (!url || !key || !secret) throw new Error("Local Supabase test environment missing.");

const client = (name: string, token = key) =>
  createClient<Database>(url, token, {
    auth: { persistSession: false, storageKey: `push-${name}-${crypto.randomUUID()}` },
  });

describe("push notification contract", () => {
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
});
