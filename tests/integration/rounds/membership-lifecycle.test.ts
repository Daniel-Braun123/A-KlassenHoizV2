import { describe, expect, it } from "vitest";
import { createPredictionFixture, createRoundInvitationFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";

const hash = async (token: string) =>
  "\\x" +
  Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(token, "base64url"))).toString(
    "hex",
  );

describe("round lifecycle", () => {
  it("transfers the only ownership and supports leave, archive and reactivation", async () => {
    const fixture = await createRoundInvitationFixture();
    const owner = createLocalActorClient("owner@example.test"),
      member = createLocalActorClient("member@example.test");
    await member.schema("api").rpc("join_round", {
      p_token_hash: await hash(fixture.token),
      p_nickname: "Neuer Besitzer",
      p_idempotency_key: crypto.randomUUID(),
    });
    const target = (
      await owner
        .schema("api")
        .from("round_members")
        .select("id,role")
        .eq("round_id", fixture.roundId)
        .eq("role", "member")
        .single()
    ).data!;
    const archived = await owner
      .schema("api")
      .rpc("archive_round", { p_round_id: fixture.roundId, p_expected_version: 1 });
    expect(archived.data).toBe(2);
    const reactivated = await owner
      .schema("api")
      .rpc("reactivate_round", { p_round_id: fixture.roundId, p_expected_version: 2 });
    expect(reactivated.data).toBe(3);
    const transferred = await owner.schema("api").rpc("transfer_round_ownership", {
      p_round_id: fixture.roundId,
      p_target_membership_id: target.id!,
      p_expected_version: 3,
    });
    expect(transferred.data).toBe(4);
    expect(
      (
        await owner
          .schema("api")
          .from("my_rounds")
          .select("role")
          .eq("id", fixture.roundId)
          .single()
      ).data?.role,
    ).toBe("member");
    expect(
      (
        await member
          .schema("api")
          .from("my_rounds")
          .select("role")
          .eq("id", fixture.roundId)
          .single()
      ).data?.role,
    ).toBe("owner");
    expect(
      (await member.schema("api").rpc("leave_round", { p_round_id: fixture.roundId })).error?.code,
    ).toBe("P0001");
    expect(
      (await owner.schema("api").rpc("leave_round", { p_round_id: fixture.roundId })).error,
    ).toBeNull();
    expect(
      (await owner.schema("api").from("my_rounds").select("id").eq("id", fixture.roundId)).data,
    ).toEqual([]);
  }, 30_000);

  it("hard deletes only private round data and leaves a minimal audit", async () => {
    const fixture = await createPredictionFixture(1);
    const owner = createLocalActorClient("owner@example.test"),
      admin = createLocalActorClient("app-admin@example.test");
    await owner.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: fixture.matches[0]!.id,
      p_home_goals: 1,
      p_away_goals: 0,
      p_idempotency_key: crypto.randomUUID(),
    });
    const wrong = await owner.schema("api").rpc("hard_delete_round", {
      p_round_id: fixture.roundId,
      p_expected_version: 1,
      p_confirmation_name: "Falscher Name",
    });
    expect(wrong.error?.code).toBe("22023");
    expect(
      (await owner.schema("api").from("my_rounds").select("id").eq("id", fixture.roundId)).data,
    ).toHaveLength(1);
    const deletion = await owner.schema("api").rpc("hard_delete_round", {
      p_round_id: fixture.roundId,
      p_expected_version: 1,
      p_confirmation_name: fixture.roundName,
    });
    expect(deletion.error).toBeNull();
    expect(
      (await owner.schema("api").from("my_rounds").select("id").eq("id", fixture.roundId)).data,
    ).toEqual([]);
    expect(
      (
        await admin
          .schema("api")
          .from("competition_catalog")
          .select("league_season_id")
          .eq("league_season_id", fixture.competitionId)
      ).data,
    ).toHaveLength(1);
  }, 30_000);
});
