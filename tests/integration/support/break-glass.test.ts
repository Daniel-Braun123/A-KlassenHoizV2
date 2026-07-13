import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture } from "../../helpers/fixtures";
const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");
const make = (name: string) =>
  createClient<Database>(url, key, {
    auth: { persistSession: false, storageKey: "support-" + name + "-" + crypto.randomUUID() },
  });
describe("break-glass support metadata", () => {
  it("is short-lived, read-only, scoped, audited and reveals no private values", async () => {
    const fixture = await createPredictionFixture(1);
    const owner = make("owner"),
      admin = make("admin"),
      member = make("member");
    await Promise.all([
      owner.auth.signInWithPassword({ email: "owner@example.test", password: "LocalFixture42!" }),
      admin.auth.signInWithPassword({
        email: "app-admin@example.test",
        password: "LocalFixture42!",
      }),
      member.auth.signInWithPassword({ email: "member@example.test", password: "LocalFixture42!" }),
    ]);
    await owner.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: fixture.matches[0]!.id,
      p_home_goals: 2,
      p_away_goals: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    const denied = await member.schema("api").rpc("create_support_access", {
      p_round_id: fixture.roundId,
      p_case_reference: "CASE-1",
      p_reason: "Ausreichend begründeter Supportfall",
      p_duration_minutes: 15,
    });
    expect(denied.error?.code).toBe("42501");
    const tooLong = await admin.schema("api").rpc("create_support_access", {
      p_round_id: fixture.roundId,
      p_case_reference: "CASE-2",
      p_reason: "Ausreichend begründeter Supportfall",
      p_duration_minutes: 16,
    });
    expect(tooLong.error?.code).toBe("22023");
    const grant = await admin.schema("api").rpc("create_support_access", {
      p_round_id: fixture.roundId,
      p_case_reference: "CASE-3",
      p_reason: "Ausreichend begründeter Supportfall",
      p_duration_minutes: 15,
    });
    expect(grant.error).toBeNull();
    const metadata = await admin
      .schema("api")
      .rpc("get_support_metadata", { p_grant_id: grant.data![0]!.grant_id });
    expect(metadata.data?.[0]).toMatchObject({
      object_id: fixture.roundId,
      member_count: 1,
      active_member_count: 1,
      has_prediction_activity: true,
    });
    expect(Object.keys(metadata.data![0]!)).not.toEqual(
      expect.arrayContaining(["name", "nickname", "email", "home_goals", "away_goals"]),
    );
    expect(
      (await admin.schema("api").from("my_rounds").select("id").eq("id", fixture.roundId)).data,
    ).toEqual([]);
    await admin
      .schema("api")
      .rpc("revoke_support_access", { p_grant_id: grant.data![0]!.grant_id });
    expect(
      (
        await admin
          .schema("api")
          .rpc("get_support_metadata", { p_grant_id: grant.data![0]!.grant_id })
      ).error?.code,
    ).toBe("42501");
  }, 30_000);
});
