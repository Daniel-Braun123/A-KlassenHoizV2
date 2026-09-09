import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture, createPublishedCompetition } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

test("admin closes and reopens a season; tied podium and own result replace the recap", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(150_000);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local Supabase required");
  const admin = createLocalActorClient("app-admin@example.test");
  const owner = createLocalActorClient("owner@example.test");
  const member = createLocalActorClient("member@example.test");
  const outsider = createLocalActorClient("nonmember@example.test");
  const empty = await createPublishedCompetition();
  expect(
    (
      await admin.schema("api").rpc("transition_league_season", {
        p_id: empty.id,
        p_expected_version: 2,
        p_status: "completed",
      })
    ).error?.code,
  ).toBe("23514");
  const fixture = await createPredictionFixture(2);
  const args = {
    p_id: fixture.competitionId,
    p_expected_version: 2,
    p_status: "completed" as const,
  };
  expect((await owner.schema("api").rpc("transition_league_season", args)).error?.code).toBe(
    "42501",
  );
  expect((await admin.schema("api").rpc("transition_league_season", args)).error?.code).toBe(
    "23514",
  );
  expect(
    (
      await outsider
        .schema("api")
        .from("round_season_state")
        .select("*")
        .eq("round_id", fixture.roundId)
    ).data,
  ).toEqual([]);
  expect((await owner.schema("api").from("admin_season_completion").select("*")).data).toEqual([]);
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
  for (const match of fixture.matches) {
    for (const actor of [owner, member])
      expect(
        (
          await actor.schema("api").rpc("save_prediction", {
            p_round_id: fixture.roundId,
            p_match_id: match.id,
            p_home_goals: 2,
            p_away_goals: 1,
            p_idempotency_key: crypto.randomUUID(),
          })
        ).error,
      ).toBeNull();
  }
  await loginAsLocalUser(
    page,
    "app-admin@example.test",
    `/admin/competitions/${fixture.competitionId}`,
  );
  const toggle = page.getByRole("switch", { name: "Saison abgeschlossen" });
  await expect(toggle).toBeDisabled();
  await expect(page.getByText("2 Spiele noch ohne Ergebnis.")).toBeVisible();
  for (const match of fixture.matches) {
    finishMatchForLocalTest(match.id);
    expect(
      (
        await admin.schema("api").rpc("set_match_result", {
          p_match_id: match.id,
          p_expected_match_version: match.version,
          p_expected_revision: 0,
          p_decision: "official",
          p_home_goals: 2,
          p_away_goals: 1,
          p_reason: "Saisonabschluss lokal testen",
        })
      ).error,
    ).toBeNull();
  }
  await page.reload();
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await page.getByRole("button", { name: "Saison abschließen", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".publication-status")).toHaveText("Abgeschlossen");
  await page.screenshot({
    path: testInfo.outputPath("admin-season-completed.png"),
    fullPage: true,
  });
  // Completion also blocks legacy API writes until the admin explicitly reopens.
  expect(
    (
      await admin.schema("api").rpc("set_match_result", {
        p_match_id: fixture.matches[0]!.id,
        p_expected_match_version: 3,
        p_expected_revision: 1,
        p_decision: "official",
        p_home_goals: 3,
        p_away_goals: 1,
        p_reason: "Must reopen",
      })
    ).error?.code,
  ).toBe("23514");
  expect(
    (await admin.schema("api").rpc("transition_league_season", { ...args, p_status: "published" }))
      .error?.code,
  ).toBe("P0001");
  await context.clearCookies();
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}`);
  await expect(page.getByRole("heading", { name: "Saison abgeschlossen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Letzter Spieltag" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Aktueller Spieltag" })).toHaveCount(0);
  await expect(page.getByText("Platz 1 · geteilt")).toBeVisible();
  await expect(page.getByText("Alex", { exact: true })).toBeVisible();
  await expect(page.getByText("Dein Saisonergebnis")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("season-review-light.png"), fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.screenshot({ path: testInfo.outputPath("season-review-dark.png"), fullPage: true });
  expect(
    await page.locator(".season-podium").evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("season-podium-arrive-reduced");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
      .violations,
  ).toEqual([]);
  const current = await admin
    .schema("api")
    .from("admin_season_completion")
    .select("version")
    .eq("id", fixture.competitionId)
    .single();
  expect(
    (
      await admin.schema("api").rpc("transition_league_season", {
        p_id: fixture.competitionId,
        p_expected_version: current.data!.version!,
        p_status: "published",
      })
    ).error,
  ).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Saison abgeschlossen" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Letzter Spieltag" })).toBeVisible();
  expect(
    (
      await admin.schema("api").rpc("set_match_result", {
        p_match_id: fixture.matches[0]!.id,
        p_expected_match_version: 3,
        p_expected_revision: 1,
        p_decision: "official",
        p_home_goals: 3,
        p_away_goals: 1,
        p_reason: "Korrektur nach Wiederöffnung",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.schema("api").rpc("transition_league_season", {
        p_id: fixture.competitionId,
        p_expected_version: current.data!.version! + 1,
        p_status: "completed",
      })
    ).error,
  ).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Saison abgeschlossen" })).toBeVisible();
});

test("three podium places render on mobile and desktop in both themes", async ({
  page,
}, testInfo) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Local Supabase required");
  const fixture = await createPredictionFixture(1);
  const owner = createLocalActorClient("owner@example.test");
  const admin = createLocalActorClient("app-admin@example.test");
  const token = `\\x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;
  expect(
    (
      await owner
        .schema("api")
        .rpc("rotate_round_invitation", { p_round_id: fixture.roundId, p_token_hash: token })
    ).error,
  ).toBeNull();
  const actors = [
    owner,
    createLocalActorClient("member@example.test"),
    createLocalActorClient("nonmember@example.test"),
  ];
  for (const [i, actor] of actors.entries()) {
    if (i > 0)
      expect(
        (
          await actor.schema("api").rpc("join_round", {
            p_token_hash: token,
            p_nickname: i === 1 ? "Alex" : "Felix",
            p_idempotency_key: crypto.randomUUID(),
          })
        ).error,
      ).toBeNull();
    expect(
      (
        await actor.schema("api").rpc("save_prediction", {
          p_round_id: fixture.roundId,
          p_match_id: fixture.matches[0]!.id,
          p_home_goals: i === 0 ? 2 : i === 1 ? 1 : 0,
          p_away_goals: i === 0 ? 1 : 0,
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
        p_expected_match_version: 2,
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
  await expect(
    page.getByRole("list", { name: "Podest der Saison" }).getByRole("listitem"),
  ).toHaveCount(3);
  await expect(page.getByText("Platz 2", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("podium-light.png"), fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await page.screenshot({ path: testInfo.outputPath("podium-dark.png"), fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  console.log(
    `Local season demo: /rounds/${fixture.roundId}; admin /admin/competitions/${fixture.competitionId}`,
  );
});
