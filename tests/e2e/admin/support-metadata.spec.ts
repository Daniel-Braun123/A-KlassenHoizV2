import { expect, test } from "@playwright/test";
import { loginAsLocalAppAdmin } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";

test("support access is scoped, short-lived, private and revocable", async ({ page }) => {
  test.setTimeout(90_000);
  const fixture = await createPredictionFixture(1);
  const owner = createLocalActorClient("owner@example.test");
  await owner.schema("api").rpc("save_prediction", {
    p_round_id: fixture.roundId,
    p_match_id: fixture.matches[0]!.id,
    p_home_goals: 4,
    p_away_goals: 2,
    p_idempotency_key: crypto.randomUUID(),
  });

  await loginAsLocalAppAdmin(page);
  await page.getByRole("link", { name: "Support" }).click();
  await expect(page).toHaveURL(/\/admin\/support$/);
  await page.getByLabel("Nicht sprechende Runden-ID").fill(fixture.roundId);
  await page.getByLabel("Fallreferenz").fill("E2E-SUPPORT-1");
  await page.getByLabel("Begründung").fill("E2E-Prüfung eines eng begrenzten Supportfalls");
  await page.getByLabel("Dauer in Minuten").fill("1");
  await page.getByRole("button", { name: "Zugriff starten und einmal lesen" }).click();

  await expect(page.getByRole("heading", { name: "Support-Metadaten" })).toBeVisible();
  await expect(page.getByText(fixture.roundId, { exact: true })).toBeVisible();
  await expect(page.getByText("Tippaktivität vorhanden")).toBeVisible();
  await expect(page.getByText(fixture.roundName, { exact: true })).toHaveCount(0);
  await expect(page.getByText("owner@example.test", { exact: true })).toHaveCount(0);
  await expect(page.getByText("4", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Sofort widerrufen" }).click();
  await expect(page.getByText("Supportzugriff wurde widerrufen.")).toBeVisible();
});
