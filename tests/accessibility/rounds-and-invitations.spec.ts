import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsLocalUser } from "../helpers/admin";
import { createPublishedCompetition, createRoundInvitationFixture } from "../helpers/fixtures";
async function axe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
test("round creation is accessible", async ({ page }) => {
  await createPublishedCompetition();
  await loginAsLocalUser(page, "owner@example.test", "/rounds/new");
  await axe(page);
});
test("invitation preview and join form are accessible", async ({ page }) => {
  const fixture = await createRoundInvitationFixture();
  await page.goto(`/invite/${fixture.token}`);
  await axe(page);
  await page.getByRole("link", { name: "Anmelden" }).click();
  await page.getByLabel("E-Mail-Adresse").fill("member@example.test");
  await page.locator('input[name="password"]').fill("LocalFixture42!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Der Tipprunde beitreten" })).toBeVisible();
  await axe(page);
});
test("owner settings and invitation controls are accessible", async ({ page }) => {
  const fixture = await createRoundInvitationFixture();
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/settings`);
  await axe(page);
});
