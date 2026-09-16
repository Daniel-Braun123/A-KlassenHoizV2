import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture, createPublishedCompetition } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

test("the owner carries a finished round into a later season while preserving its history", async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local Supabase required");

  const admin = createLocalActorClient("app-admin@example.test");
  const owner = createLocalActorClient("owner@example.test");
  const member = createLocalActorClient("member@example.test");
  const fixture = await createPredictionFixture(1);
  const target = await createPublishedCompetition("27/28");
  const token = `\\x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;

  expect(
    (
      await owner
        .schema("api")
        .rpc("rotate_round_invitation", { p_round_id: fixture.roundId, p_token_hash: token })
    ).error,
  ).toBeNull();
  expect(
    (
      await member.schema("api").rpc("join_round", {
        p_token_hash: token,
        p_nickname: "Alex",
        p_idempotency_key: crypto.randomUUID(),
      })
    ).error,
  ).toBeNull();

  for (const actor of [owner, member]) {
    expect(
      (
        await actor.schema("api").rpc("save_prediction", {
          p_round_id: fixture.roundId,
          p_match_id: fixture.matches[0]!.id,
          p_home_goals: 2,
          p_away_goals: 1,
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).toBeNull();
  }

  finishMatchForLocalTest(fixture.matches[0]!.id);
  expect(
    (
      await admin.schema("api").rpc("set_match_result", {
        p_match_id: fixture.matches[0]!.id,
        p_expected_match_version: fixture.matches[0]!.version,
        p_expected_revision: 0,
        p_decision: "official",
        p_home_goals: 2,
        p_away_goals: 1,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.schema("api").rpc("transition_league_season", {
        p_id: fixture.competitionId,
        p_expected_version: 2,
        p_status: "completed",
      })
    ).error,
  ).toBeNull();

  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}`);
  await expect(page.getByRole("heading", { name: "Saison abgeschlossen" })).toBeVisible();
  await page.getByText("Tipprunde in neue Saison übernehmen").click();
  await page.getByLabel("Neue Liga / Saison").selectOption(target.id);
  await expect(page.getByLabel("Neue Liga / Saison")).toHaveValue(target.id);
  await expect(page.getByText("starten Tipps und Punkte bei null", { exact: false })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("season-rollover.png"), fullPage: true });

  await page.getByRole("button", { name: "Neue Tipprunde erstellen" }).click();
  await page.waitForURL(
    (current) =>
      /^\/rounds\/[0-9a-f-]+$/.test(current.pathname) &&
      current.pathname !== `/rounds/${fixture.roundId}`,
  );
  const successorRoundId = page.url().split("/").at(-1)!;
  await expect(page.getByRole("heading", { name: fixture.roundName })).toBeVisible();
  await expect(page.getByText(target.label, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Vorherige Saison ansehen" })).toHaveAttribute(
    "href",
    `/rounds/${fixture.roundId}`,
  );

  const successor = await owner
    .schema("api")
    .from("my_rounds")
    .select("id,predecessor_round_id")
    .eq("id", successorRoundId)
    .single();
  expect(successor.error).toBeNull();
  expect(successor.data?.predecessor_round_id).toBe(fixture.roundId);
  expect(
    (await member.schema("api").from("my_rounds").select("id").eq("id", successorRoundId).single())
      .error,
  ).toBeNull();

  await page.goto(`/rounds/${fixture.roundId}`);
  await expect(page.getByRole("heading", { name: "Saison abgeschlossen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Neue Saison öffnen" })).toHaveAttribute(
    "href",
    `/rounds/${successorRoundId}`,
  );
  await page.goto(`/rounds/${fixture.roundId}/settings`);
  await expect(page.getByRole("heading", { name: "Einladungen zur neuen Saison" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Neuen 7-Tage-Link erzeugen" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Neue Saison öffnen" })).toHaveAttribute(
    "href",
    `/rounds/${successorRoundId}`,
  );

  const newcomer = createLocalActorClient("nonmember@example.test");
  const newToken = `\\x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;
  expect(
    (
      await owner
        .schema("api")
        .rpc("rotate_round_invitation", { p_round_id: successorRoundId, p_token_hash: newToken })
    ).error,
  ).toBeNull();
  expect(
    (
      await newcomer.schema("api").rpc("join_round", {
        p_token_hash: newToken,
        p_nickname: "Neu dabei",
        p_idempotency_key: crypto.randomUUID(),
      })
    ).error,
  ).toBeNull();
  await loginAsLocalUser(page, "nonmember@example.test", `/rounds/${successorRoundId}`);
  await expect(page.getByRole("heading", { name: fixture.roundName })).toBeVisible();
  await expect(page.getByRole("link", { name: "Vorherige Saison ansehen" })).toHaveCount(0);
});
