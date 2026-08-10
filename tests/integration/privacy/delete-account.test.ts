import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { createRoundInvitationFixture } from "../../helpers/fixtures";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (!url || !key || !secret) throw new Error("Local Supabase test environment missing.");
const make = (name: string, token = key) =>
  createClient<Database>(url, token, {
    auth: { persistSession: false, storageKey: "privacy-" + name + "-" + crypto.randomUUID() },
  });
const hash = async (token: string) =>
  "\\x" +
  Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(token, "base64url"))).toString(
    "hex",
  );

describe("account deletion preparation", () => {
  it("hides anonymized memberships from members and rankings before auth deletion", async () => {
    const fixture = await createRoundInvitationFixture();
    const admin = make("admin", secret);
    const owner = make("owner");
    const email = "delete-" + crypto.randomUUID() + "@example.test";
    const password = "DeleteFixture42!";
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Zu löschen" },
    });
    expect(created.error).toBeNull();
    const userId = created.data.user!.id;
    const user = make("user");
    await user.auth.signInWithPassword({ email, password });
    const joined = await user.schema("api").rpc("join_round", {
      p_token_hash: await hash(fixture.token),
      p_nickname: "Privater Name",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(joined.error).toBeNull();
    const membershipId = joined.data!;
    const pushEndpoint = `https://push.example.test/${crypto.randomUUID()}`;
    const pushRegistration = await user.schema("api").rpc("upsert_my_push_subscription", {
      p_endpoint: pushEndpoint,
      p_p256dh_key: "p256dh_key_fixture_value_0123456789",
      p_auth_secret: "auth_secret_fixture",
      p_user_agent: "Deletion integration test",
    });
    expect(pushRegistration.error).toBeNull();
    const first = await user.schema("api").rpc("prepare_account_deletion");
    const second = await user.schema("api").rpc("prepare_account_deletion");
    expect(first.data).toBe(userId);
    expect(second.data).toBe(userId);
    const remainingPushDevices = await user
      .schema("api")
      .from("my_push_subscriptions")
      .select("id")
      .eq("endpoint", pushEndpoint);
    expect(remainingPushDevices.error).toBeNull();
    expect(remainingPushDevices.data).toEqual([]);
    await owner.auth.signInWithPassword({
      email: "owner@example.test",
      password: "LocalFixture42!",
    });
    const visibleMembers = await owner
      .schema("api")
      .from("round_members")
      .select("id")
      .eq("round_id", fixture.roundId)
      .eq("id", membershipId);
    expect(visibleMembers.error).toBeNull();
    expect(visibleMembers.data).toEqual([]);
    const visibleRanking = await owner
      .schema("api")
      .from("overall_ranking")
      .select("membership_id")
      .eq("round_id", fixture.roundId)
      .eq("membership_id", membershipId);
    expect(visibleRanking.error).toBeNull();
    expect(visibleRanking.data).toEqual([]);
    expect((await admin.auth.admin.deleteUser(userId)).error).toBeNull();
    const gone = await admin.auth.admin.getUserById(userId);
    expect(gone.data.user).toBeNull();
  }, 30_000);
});
