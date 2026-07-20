import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

test("two private rounds receive corrected points and rankings from one central result", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const fixture = await createPredictionFixture(1);
  const match = fixture.matches[0]!;
  const ownerApi = createLocalActorClient("owner@example.test"),
    memberApi = createLocalActorClient("member@example.test"),
    adminApi = createLocalActorClient("app-admin@example.test");
  const second = await memberApi.schema("api").rpc("create_round", {
    p_name: `Zweite ${crypto.randomUUID().slice(0, 6)}`,
    p_league_season_id: fixture.competitionId,
    p_nickname: "Freund",
    p_idempotency_key: crypto.randomUUID(),
  });
  await ownerApi.schema("api").rpc("save_prediction", {
    p_round_id: fixture.roundId,
    p_match_id: match.id,
    p_home_goals: 2,
    p_away_goals: 1,
    p_idempotency_key: crypto.randomUUID(),
  });
  await memberApi.schema("api").rpc("save_prediction", {
    p_round_id: second.data!,
    p_match_id: match.id,
    p_home_goals: 3,
    p_away_goals: 1,
    p_idempotency_key: crypto.randomUUID(),
  });
  finishMatchForLocalTest(match.id);
  await adminApi.schema("api").rpc("set_match_result", {
    p_match_id: match.id,
    p_expected_match_version: 2,
    p_expected_revision: 0,
    p_decision: "official",
    p_home_goals: 2,
    p_away_goals: 1,
    p_reason: "Ergebnis",
  });
  const ownerContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const owner = await ownerContext.newPage();
  await loginAsLocalUser(owner, "owner@example.test", `/rounds/${fixture.roundId}/rankings`);
  await expect(owner.getByRole("heading", { name: "Rangliste" })).toBeVisible();
  let ownerRow = owner.getByRole("table").first().getByRole("row").filter({ hasText: "Daniel" });
  await expect(ownerRow.getByRole("cell", { name: "4" })).toBeVisible();
  const memberContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const member = await memberContext.newPage();
  await loginAsLocalUser(member, "member@example.test", `/rounds/${second.data!}/rankings`);
  let memberRow = member.getByRole("table").first().getByRole("row").filter({ hasText: "Freund" });
  await expect(memberRow.getByRole("cell", { name: "2" })).toBeVisible();
  await adminApi.schema("api").rpc("set_match_result", {
    p_match_id: match.id,
    p_expected_match_version: 3,
    p_expected_revision: 1,
    p_decision: "official",
    p_home_goals: 3,
    p_away_goals: 1,
    p_reason: "Korrektur",
  });
  await owner.reload();
  await member.reload();
  ownerRow = owner.getByRole("table").first().getByRole("row").filter({ hasText: "Daniel" });
  memberRow = member.getByRole("table").first().getByRole("row").filter({ hasText: "Freund" });
  await expect(ownerRow.getByRole("cell", { name: "2" })).toBeVisible();
  await expect(memberRow.getByRole("cell", { name: "4" })).toBeVisible();
  await owner.goto(`/rounds/${fixture.roundId}/table`);
  const homeRow = owner.getByRole("row").filter({ hasText: match.homeName });
  const awayRow = owner.getByRole("row").filter({ hasText: match.awayName });
  await expect(homeRow).toContainText("3:1");
  await expect(homeRow).toContainText("3");
  await expect(awayRow).toContainText("1:3");
  await expect(awayRow).toContainText("0");
  await member.goto(`/rounds/${second.data!}/table`);
  await expect(member.getByRole("row").filter({ hasText: match.homeName })).toContainText("3:1");
  await ownerContext.close();
  await memberContext.close();
});
