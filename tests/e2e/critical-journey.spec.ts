import { expect, test } from "@playwright/test";
import { createPredictionFixture } from "../helpers/fixtures";
import { createLocalActorClient } from "../helpers/local-actors";

test("central competition to registration, invitation, prediction, result and ranking", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  const fixture = await createPredictionFixture(1);
  const match = fixture.matches[0]!;

  const owner = createLocalActorClient("owner@example.test");
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(raw).toString("base64url");
  const tokenHash = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
  const invitation = await owner.schema("api").rpc("rotate_round_invitation", {
    p_round_id: fixture.roundId,
    p_token_hash: `\\x${Buffer.from(tokenHash).toString("hex")}`,
  });
  expect(invitation.error).toBeNull();

  await page.goto(`/invite/${token}`);
  await expect(page.getByRole("heading", { name: fixture.roundName })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/register\?next=/),
    page.getByRole("link", { name: "Konto erstellen" }).click(),
  ]);
  const suffix = crypto.randomUUID().slice(0, 8);
  const nickname = `Freund ${suffix}`;
  await page.getByLabel("Anzeigename").fill(nickname);
  await page.getByLabel("E-Mail-Adresse").fill(`journey-${suffix}@example.test`);
  await page.locator('input[name="password"]').fill("LocalFixture42!");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByRole("heading", { name: "Der Tipprunde beitreten" })).toBeVisible();
  await page.getByLabel("Dein Rundennickname").fill(nickname);
  await page.getByRole("button", { name: "Jetzt beitreten" }).click();

  await page.getByRole("link", { name: new RegExp(fixture.roundName) }).click();
  await page.getByRole("link", { name: "Tippen", exact: true }).click();
  const card = page.locator(".prediction-card").first();
  await card.locator("input").nth(0).fill("2");
  await card.locator("input").nth(1).fill("1");
  await expect(card.getByText("Gespeichert", { exact: true })).toBeVisible();

  const admin = createLocalActorClient("app-admin@example.test");
  const result = await admin.schema("api").rpc("set_match_result", {
    p_match_id: match.id,
    p_expected_match_version: 2,
    p_expected_revision: 0,
    p_decision: "official",
    p_home_goals: 2,
    p_away_goals: 1,
    p_reason: "Kritische Journey",
  });
  expect(result.error).toBeNull();

  await page.getByRole("link", { name: "Rangliste" }).click();
  const row = page.getByRole("table").first().getByRole("row").filter({ hasText: nickname });
  await expect(row.getByRole("cell", { name: "4" })).toBeVisible();
});
