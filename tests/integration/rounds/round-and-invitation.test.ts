import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Local Supabase test environment missing.");
const client = (storageKey: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, storageKey } });
const admin = client("round-admin"),
  owner = client("round-owner"),
  member = client("round-member"),
  anonymous = client("round-anon");
const bytea = (bytes: Uint8Array) => `\\x${Buffer.from(bytes).toString("hex")}`;

describe("private round and invitation contracts", () => {
  it("creates exactly one owner, rotates a hashed invitation and joins idempotently", async () => {
    await admin.auth.signInWithPassword({
      email: "app-admin@example.test",
      password: "LocalFixture42!",
    });
    const suffix = crypto.randomUUID().slice(0, 8);
    const league = await admin
      .schema("api")
      .rpc("create_league", { p_name: `Round League ${suffix}` });
    const season = await admin.schema("api").rpc("create_season", {
      p_label: `R-${suffix}`,
      p_starts_on: "2026-07-01",
      p_ends_on: "2027-06-30",
    });
    const competition = await admin
      .schema("api")
      .rpc("create_league_season", { p_league_id: league.data!, p_season_id: season.data! });
    await admin.schema("api").rpc("transition_league_season", {
      p_id: competition.data!,
      p_expected_version: 1,
      p_status: "published",
    });

    await owner.auth.signInWithPassword({
      email: "owner@example.test",
      password: "LocalFixture42!",
    });
    const createKey = crypto.randomUUID();
    const first = await owner.schema("api").rpc("create_round", {
      p_name: `Freunde ${suffix}`,
      p_league_season_id: competition.data!,
      p_nickname: "Daniel",
      p_idempotency_key: createKey,
    });
    const repeated = await owner.schema("api").rpc("create_round", {
      p_name: "Ignored replay",
      p_league_season_id: competition.data!,
      p_nickname: "Ignored",
      p_idempotency_key: createKey,
    });
    expect(first.error).toBeNull();
    expect(repeated.data).toBe(first.data);
    const parallelKey = crypto.randomUUID();
    const parallel = await Promise.all([
      owner.schema("api").rpc("create_round", {
        p_name: `Parallel ${suffix}`,
        p_league_season_id: competition.data!,
        p_nickname: "Parallel",
        p_idempotency_key: parallelKey,
      }),
      owner.schema("api").rpc("create_round", {
        p_name: `Parallel ${suffix}`,
        p_league_season_id: competition.data!,
        p_nickname: "Parallel",
        p_idempotency_key: parallelKey,
      }),
    ]);
    expect(parallel[0].error ?? parallel[1].error).toBeNull();
    expect(parallel[0].data).toBe(parallel[1].data);
    const ownRounds = await owner
      .schema("api")
      .from("my_rounds")
      .select("id,role,nickname")
      .eq("id", first.data!);
    expect(ownRounds.data).toEqual([{ id: first.data, role: "owner", nickname: "Daniel" }]);

    const raw = crypto.getRandomValues(new Uint8Array(32));
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
    const rotation = await owner
      .schema("api")
      .rpc("rotate_round_invitation", { p_round_id: first.data!, p_token_hash: bytea(hash) });
    expect(rotation.error).toBeNull();
    const preview = await anonymous
      .schema("api")
      .rpc("get_invitation_preview", { p_token_hash: bytea(hash) });
    expect(preview.data?.[0]?.round_name).toBe(`Freunde ${suffix}`);

    await member.auth.signInWithPassword({
      email: "member@example.test",
      password: "LocalFixture42!",
    });
    const joinKey = crypto.randomUUID();
    const joined = await member.schema("api").rpc("join_round", {
      p_token_hash: bytea(hash),
      p_nickname: "Mitspieler",
      p_idempotency_key: joinKey,
    });
    const joinedAgain = await member.schema("api").rpc("join_round", {
      p_token_hash: bytea(hash),
      p_nickname: "Anderer Name",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(joined.error).toBeNull();
    expect(joinedAgain.data).toBe(joined.data);
    expect(
      (await member.schema("api").from("my_rounds").select("id").eq("id", first.data!)).data,
    ).toHaveLength(1);

    expect(
      (await admin.schema("api").from("my_rounds").select("id").eq("id", first.data!)).data,
    ).toEqual([]);
  }, 20_000);
});
