import { expect, test } from "@playwright/test";

import { berlinDateKey } from "@/features/competition/schedule-display";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

const bytea = (bytes: Uint8Array) => `\\x${Buffer.from(bytes).toString("hex")}`;

test.use({ viewport: { width: 375, height: 812 } });

test("offers the contextual installation after the first saved prediction", async ({
  page,
}, testInfo) => {
  test.skip(
    !["mobile-chrome", "mobile-safari"].includes(testInfo.project.name),
    "The contextual installation is verified on mobile browsers.",
  );

  const fixture = await createPredictionFixture(1);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);

  if (testInfo.project.name === "mobile-chrome") {
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(event);
    });
  }

  const card = page.locator(".prediction-card").first();
  await card.locator("input").nth(0).fill("2");
  await card.locator("input").nth(1).fill("1");
  await page.getByRole("button", { name: "Tipps speichern" }).click();

  const dialog = page.getByRole("dialog", { name: "A-KlassenHoiz installieren" });
  await expect(dialog).toBeVisible();
  if (testInfo.project.name === "mobile-safari") {
    await expect(dialog.getByText("Teilen", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Zum Home-Bildschirm", { exact: true })).toBeVisible();
  } else {
    await expect(dialog.getByRole("button", { name: "App installieren" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Nicht jetzt" })).toBeVisible();
  }
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath(`pwa-install-prompt-${testInfo.project.name}.png`),
  });
});

test("mobile user collects eight predictions and saves them together with offline retry", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const fixture = await createPredictionFixture(8);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  await expect(page.getByRole("heading", { name: "Tipps abgeben" })).toBeVisible();
  const cards = page.locator(".prediction-card");
  await expect(cards).toHaveCount(8);
  await expect(page.getByRole("combobox", { name: "Spieltag" })).toBeVisible();
  const firstCardBox = await cards.first().boundingBox();
  const firstScoreBox = await cards.first().locator("input").first().boundingBox();
  const secondScoreBox = await cards.first().locator("input").nth(1).boundingBox();
  expect(firstCardBox?.height).toBeLessThanOrEqual(80);
  expect(Math.abs((firstScoreBox?.y ?? 0) - (secondScoreBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect((secondScoreBox?.x ?? 0) - (firstScoreBox?.x ?? 0)).toBeGreaterThan(48);

  await context.setOffline(true);
  for (let index = 0; index < 8; index += 1) {
    await cards
      .nth(index)
      .locator("input")
      .nth(0)
      .fill(String(index % 4));
    await cards
      .nth(index)
      .locator("input")
      .nth(1)
      .fill(String((index + 1) % 3));
  }
  await expect(page.getByText("Gespeichert", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tipps speichern" }).click();
  await expect(page.getByText("Das hat gerade nicht funktioniert.")).toBeVisible();

  await context.setOffline(false);
  await page.getByRole("button", { name: "Tipps speichern" }).click();
  await expect(page.getByText("8 Tipps wurden gespeichert.")).toBeVisible();
  await expect(page.getByText("Alle eingegebenen Tipps sind gespeichert")).toBeVisible();
});

test("saving a matchday keeps that matchday selected", async ({ page }) => {
  const fixture = await createPredictionFixture(1);
  const admin = createLocalActorClient("app-admin@example.test");
  const league = await admin
    .schema("api")
    .from("admin_leagues")
    .select("club_ids")
    .eq("id", fixture.competitionId)
    .single();
  expect(league.error).toBeNull();
  const clubIds = league.data?.club_ids ?? [];
  expect(clubIds).toHaveLength(2);

  const secondKickoff = new Date(Date.now() + 172_800_000);
  const secondMatchday = await admin.schema("api").rpc("create_matchday_auto", {
    p_league_id: fixture.competitionId,
    p_phase: "first_leg",
    p_starts_on: berlinDateKey(secondKickoff),
    p_ends_on: berlinDateKey(secondKickoff),
  });
  expect(secondMatchday.error).toBeNull();
  const secondMatch = await admin.schema("api").rpc("create_match_simple", {
    p_matchday_id: secondMatchday.data!,
    p_home_club_id: clubIds[0]!,
    p_away_club_id: clubIds[1]!,
    p_kickoff_at: secondKickoff.toISOString(),
  });
  expect(secondMatch.error).toBeNull();

  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  const matchday = page.getByRole("combobox", { name: "Spieltag" });
  await expect(matchday).toHaveValue(fixture.matchdayId);

  const card = page.locator(".prediction-card").first();
  await card.locator("input").nth(0).fill("2");
  await card.locator("input").nth(1).fill("1");
  await page.getByRole("button", { name: "Tipps speichern" }).click();

  await expect(page.getByText("Der Tipp wurde gespeichert.")).toBeVisible();
  await expect(matchday).toHaveValue(fixture.matchdayId);
  await expect(page).toHaveURL(
    new RegExp(`/rounds/${fixture.roundId}/predictions\\?matchday=${fixture.matchdayId}$`),
  );
});

test("opens the matchday whose period is nearest to today", async ({ page }) => {
  const fixture = await createPredictionFixture(1, 7 * 86_400_000);
  const admin = createLocalActorClient("app-admin@example.test");
  const league = await admin
    .schema("api")
    .from("admin_leagues")
    .select("club_ids")
    .eq("id", fixture.competitionId)
    .single();
  expect(league.error).toBeNull();
  const clubIds = league.data?.club_ids ?? [];
  const nearestKickoff = new Date(Date.now() + 86_400_000);
  const nearestMatchday = await admin.schema("api").rpc("create_matchday_auto", {
    p_league_id: fixture.competitionId,
    p_phase: "second_leg",
    p_starts_on: berlinDateKey(nearestKickoff),
    p_ends_on: berlinDateKey(nearestKickoff),
  });
  expect(nearestMatchday.error).toBeNull();
  const nearestMatch = await admin.schema("api").rpc("create_match_simple", {
    p_matchday_id: nearestMatchday.data!,
    p_home_club_id: clubIds[0]!,
    p_away_club_id: clubIds[1]!,
    p_kickoff_at: nearestKickoff.toISOString(),
  });
  expect(nearestMatch.error).toBeNull();

  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);

  await expect(page.getByRole("combobox", { name: "Spieltag" })).toHaveValue(nearestMatchday.data!);
});

test("shows every member's earned points with the visible round predictions", async ({ page }) => {
  const fixture = await createPredictionFixture(1);
  const match = fixture.matches[0]!;
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
    p_home_goals: 1,
    p_away_goals: 0,
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
    p_reason: "Punkteanzeige testen",
  });
  expect(result.error).toBeNull();

  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  await page.getByText("Tipps der Runde (2)").click();

  const ownerRow = page.getByRole("listitem").filter({ hasText: "Daniel" });
  const memberRow = page.getByRole("listitem").filter({ hasText: "Mitspieler" });
  await expect(ownerRow).toContainText("2:1");
  await expect(ownerRow.getByLabel("4 Punkte")).toHaveText("+4 P");
  await expect(memberRow).toContainText("1:0");
  await expect(memberRow.getByLabel("3 Punkte")).toHaveText("+3 P");
});
