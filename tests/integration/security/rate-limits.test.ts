import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { createPredictionFixture, createRoundInvitationFixture } from "../../helpers/fixtures";

const url = process.env.SUPABASE_TEST_URL!;
const key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY!;
const client = (name: string) =>
  createClient<Database>(url, key, {
    auth: { persistSession: false, storageKey: `rate-${name}-${crypto.randomUUID()}` },
  });
const hash = () => `\\x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;

describe("mutation rate limits", () => {
  it("uses the configured Supabase Auth sign-in/sign-up limit", async () => {
    const config = readFileSync(join(process.cwd(), "supabase", "config.toml"), "utf8");
    expect(config).toContain("sign_in_sign_ups = 30");
  });

  it("limits invitation rotation per owner and round", async () => {
    const fixture = await createRoundInvitationFixture();
    const owner = client("owner");
    await owner.auth.signInWithPassword({
      email: "owner@example.test",
      password: "LocalFixture42!",
    });
    for (let index = 0; index < 4; index += 1)
      expect(
        (
          await owner
            .schema("api")
            .rpc("rotate_round_invitation", { p_round_id: fixture.roundId, p_token_hash: hash() })
        ).error,
      ).toBeNull();
    expect(
      (
        await owner
          .schema("api")
          .rpc("rotate_round_invitation", { p_round_id: fixture.roundId, p_token_hash: hash() })
      ).error?.code,
    ).toBe("P0003");
  }, 30_000);

  it("limits autosave per user, round and match", async () => {
    const fixture = await createPredictionFixture(1);
    const owner = client("autosave");
    await owner.auth.signInWithPassword({
      email: "owner@example.test",
      password: "LocalFixture42!",
    });
    for (let index = 0; index < 60; index += 1)
      expect(
        (
          await owner.schema("api").rpc("save_prediction", {
            p_round_id: fixture.roundId,
            p_match_id: fixture.matches[0]!.id,
            p_home_goals: index % 10,
            p_away_goals: 1,
            p_idempotency_key: crypto.randomUUID(),
          })
        ).error,
      ).toBeNull();
    expect(
      (
        await owner.schema("api").rpc("save_prediction", {
          p_round_id: fixture.roundId,
          p_match_id: fixture.matches[0]!.id,
          p_home_goals: 1,
          p_away_goals: 1,
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error?.code,
    ).toBe("P0003");
  }, 45_000);

  it("limits break-glass grants per admin and object", async () => {
    const fixture = await createPredictionFixture(1);
    const admin = client("support");
    await admin.auth.signInWithPassword({
      email: "app-admin@example.test",
      password: "LocalFixture42!",
    });
    for (let index = 0; index < 5; index += 1)
      expect(
        (
          await admin.schema("api").rpc("create_support_access", {
            p_round_id: fixture.roundId,
            p_case_reference: `CASE-${index}`,
            p_reason: "Reproduzierbarer begründeter Supportfall",
            p_duration_minutes: 1,
          })
        ).error,
      ).toBeNull();
    expect(
      (
        await admin.schema("api").rpc("create_support_access", {
          p_round_id: fixture.roundId,
          p_case_reference: "CASE-X",
          p_reason: "Reproduzierbarer begründeter Supportfall",
          p_duration_minutes: 1,
        })
      ).error?.code,
    ).toBe("P0003");
  }, 30_000);
});
