import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

const bytea = (bytes: Uint8Array) => `\\x${Buffer.from(bytes).toString("hex")}`;

test("shows a completed matchday recap on the round overview", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const fixture = await createPredictionFixture(3);
  const owner = createLocalActorClient("owner@example.test");
  const member = createLocalActorClient("member@example.test");
  const admin = createLocalActorClient("app-admin@example.test");
  const invitationToken = crypto.getRandomValues(new Uint8Array(32));

  const invitation = await owner.schema("api").rpc("rotate_round_invitation", {
    p_round_id: fixture.roundId,
    p_token_hash: bytea(invitationToken),
  });
  expect(invitation.error).toBeNull();
  const membership = await member.schema("api").rpc("join_round", {
    p_token_hash: bytea(invitationToken),
    p_nickname: "Mitspieler",
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(membership.error).toBeNull();

  for (const [index, match] of fixture.matches.entries()) {
    const ownerPrediction = await owner.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: 2,
      p_away_goals: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(ownerPrediction.error).toBeNull();

    const memberPrediction = await member.schema("api").rpc("save_prediction", {
      p_round_id: fixture.roundId,
      p_match_id: match.id,
      p_home_goals: index === 0 ? 1 : 2,
      p_away_goals: index === 0 ? 0 : 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(memberPrediction.error).toBeNull();

    finishMatchForLocalTest(match.id);
    const result = await admin.schema("api").rpc("set_match_result", {
      p_match_id: match.id,
      p_expected_match_version: match.version,
      p_expected_revision: 0,
      p_decision: "official",
      p_home_goals: 2,
      p_away_goals: 1,
      p_reason: "Spieltagsrückblick testen",
    });
    expect(result.error).toBeNull();
  }

  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}`);

  const recap = page.getByRole("region", { name: "Letzter Spieltag" });
  await expect(recap).toBeVisible();
  await expect(recap.getByText("12", { exact: true })).toBeVisible();
  await expect(recap.getByText("Punkte", { exact: true })).toBeVisible();
  await expect(recap.getByText("Rangtrend", { exact: true })).toBeVisible();
  await expect(recap.getByText("Exakte Tipps", { exact: true })).toHaveCount(0);

  await expect(recap.getByText("Spiele anzeigen", { exact: true })).toHaveCount(0);
  await expect(recap.getByRole("link", { name: "Zur Spieltagsrangliste" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
  ).toBe(true);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
