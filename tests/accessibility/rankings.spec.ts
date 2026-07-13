import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../helpers/admin";
import { createPredictionFixture } from "../helpers/fixtures";
import { createLocalActorClient } from "../helpers/local-actors";

test("mobile rankings and result revisions are semantic and accessible", async ({ page }) => {
  const fixture = await createPredictionFixture(1);
  const match = fixture.matches[0]!;
  const owner = createLocalActorClient("owner@example.test");
  const admin = createLocalActorClient("app-admin@example.test");
  await owner.schema("api").rpc("save_prediction", {
    p_round_id: fixture.roundId,
    p_match_id: match.id,
    p_home_goals: 1,
    p_away_goals: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
  await admin.schema("api").rpc("set_match_result", {
    p_match_id: match.id,
    p_expected_match_version: 2,
    p_expected_revision: 0,
    p_decision: "official",
    p_home_goals: 1,
    p_away_goals: 0,
    p_reason: "Ergebnis",
  });
  await admin.schema("api").rpc("set_match_result", {
    p_match_id: match.id,
    p_expected_match_version: 3,
    p_expected_revision: 1,
    p_decision: "official",
    p_home_goals: 2,
    p_away_goals: 0,
    p_reason: "Korrektur",
  });
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/rankings`);
  let scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.goto(`/rounds/${fixture.roundId}/results`);
  scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(scan.violations).toEqual([]);
});
