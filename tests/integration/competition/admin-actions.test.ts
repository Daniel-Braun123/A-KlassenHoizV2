import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { berlinDateKey } from "@/features/competition/schedule-display";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");

const admin = createClient<Database>(url, key, {
  auth: { persistSession: false, storageKey: "competition-admin" },
});
const member = createClient<Database>(url, key, {
  auth: { persistSession: false, storageKey: "competition-member" },
});
let createdMatchId: string | null = null;

describe("global competition admin contracts", () => {
  it("builds and publishes a competition, records a result revision, and rejects stale writes", async () => {
    expect(
      (
        await admin.auth.signInWithPassword({
          email: "app-admin@example.test",
          password: "LocalFixture42!",
        })
      ).error,
    ).toBeNull();
    const suffix = crypto.randomUUID().slice(0, 8);
    const home = await admin.schema("api").rpc("create_club_simple", {
      p_name: `Heim ${suffix}`,
    });
    const away = await admin.schema("api").rpc("create_club_simple", {
      p_name: `Gast ${suffix}`,
    });
    expect(home.error ?? away.error).toBeNull();
    const competition = await admin.schema("api").rpc("create_admin_league", {
      p_name: `Liga ${suffix}`,
      p_year_label: "26/27",
      p_club_ids: [home.data!, away.data!],
    });
    expect(competition.error).toBeNull();
    const kickoffAt = new Date(Date.now() - 2 * 60 * 60 * 1_000);
    const matchday = await admin.schema("api").rpc("create_matchday_auto", {
      p_league_id: competition.data!,
      p_phase: "first_leg",
      p_starts_on: berlinDateKey(kickoffAt),
      p_ends_on: berlinDateKey(kickoffAt),
    });
    expect(matchday.error).toBeNull();
    const overlappingMatchday = await admin.schema("api").rpc("create_matchday_auto", {
      p_league_id: competition.data!,
      p_phase: "second_leg",
      p_starts_on: berlinDateKey(kickoffAt),
      p_ends_on: berlinDateKey(kickoffAt),
    });
    expect(overlappingMatchday.error).toBeNull();
    const outsidePeriod = await admin.schema("api").rpc("create_match_simple", {
      p_matchday_id: matchday.data!,
      p_home_club_id: home.data!,
      p_away_club_id: away.data!,
      p_kickoff_at: new Date(kickoffAt.getTime() + 2 * 86_400_000).toISOString(),
    });
    expect(outsidePeriod.error?.code).toBe("23514");
    const match = await admin.schema("api").rpc("create_match_simple", {
      p_matchday_id: matchday.data!,
      p_home_club_id: home.data!,
      p_away_club_id: away.data!,
      p_kickoff_at: kickoffAt.toISOString(),
    });
    expect(match.error).toBeNull();
    const excludingPeriod = await admin.schema("api").rpc("update_matchday_period", {
      p_id: matchday.data!,
      p_expected_version: 1,
      p_starts_on: berlinDateKey(new Date(kickoffAt.getTime() + 86_400_000)),
      p_ends_on: berlinDateKey(new Date(kickoffAt.getTime() + 86_400_000)),
    });
    expect(excludingPeriod.error?.code).toBe("23514");
    const periodUpdate = await admin.schema("api").rpc("update_matchday_period", {
      p_id: matchday.data!,
      p_expected_version: 1,
      p_starts_on: berlinDateKey(kickoffAt),
      p_ends_on: berlinDateKey(new Date(kickoffAt.getTime() + 86_400_000)),
    });
    expect(periodUpdate.data).toBe(2);
    expect(
      (
        await admin.schema("api").rpc("publish_admin_league", {
          p_id: competition.data!,
          p_expected_version: 1,
        })
      ).data,
    ).toBe(2);
    createdMatchId = match.data;
    const result = await admin.schema("api").rpc("set_match_result", {
      p_match_id: match.data!,
      p_expected_match_version: 2,
      p_expected_revision: 0,
      p_decision: "official",
      p_home_goals: 2,
      p_away_goals: 1,
      p_reason: "Lokaler Integrationstest",
    });
    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({ revision_no: 1, match_version: 3 });
  }, 20_000);

  it("rejects a stale result correction after the original request has committed", async () => {
    if (!createdMatchId) throw new Error("The previous test did not create a match.");
    const stale = await admin.schema("api").rpc("set_match_result", {
      p_match_id: createdMatchId,
      p_expected_match_version: 1,
      p_expected_revision: 0,
      p_decision: "official",
      p_home_goals: 1,
      p_away_goals: 1,
    });
    expect(stale.error?.code).toBe("P0001");
  });

  it("denies a normal member the same global mutation RPC", async () => {
    expect(
      (
        await member.auth.signInWithPassword({
          email: "member@example.test",
          password: "LocalFixture42!",
        })
      ).error,
    ).toBeNull();
    const denied = await member
      .schema("api")
      .rpc("create_club_simple", { p_name: `Denied ${crypto.randomUUID()}` });
    expect(denied.error?.code).toBe("42501");
  });
});
