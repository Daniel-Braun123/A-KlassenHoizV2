import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPublishedCompetition } from "../../helpers/fixtures";
test("round creation task is measurable from form-ready to overview", async ({ page }) => {
  test.setTimeout(90_000);
  const competition = await createPublishedCompetition();
  await loginAsLocalUser(page, "owner@example.test", "/rounds/new");
  const start = Date.now();
  const suffix = crypto.randomUUID().slice(0, 7);
  await page.getByLabel("Name der Tipprunde").fill(`Zeit ${suffix}`);
  await page.getByLabel("Liga").selectOption({ label: competition.label });
  await page.getByLabel("Dein Rundennickname").fill("Zeitnehmer");
  await page.getByRole("button", { name: "Private Tipprunde erstellen" }).click();
  await expect(page.getByRole("heading", { name: `Zeit ${suffix}` })).toBeVisible();
  expect(Date.now() - start).toBeLessThan(120_000);
});
