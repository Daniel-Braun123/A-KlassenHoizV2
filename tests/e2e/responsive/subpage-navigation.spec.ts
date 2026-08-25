import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPublishedCompetition } from "../../helpers/fixtures";

test.describe("mobile subpage navigation", () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test("round creation has a visible and reliable route back to the overview", async ({ page }) => {
    await createPublishedCompetition();
    await loginAsLocalUser(page, "owner@example.test", "/rounds/new");

    const backLink = page.getByRole("link", { name: "Zurück zur Übersicht" });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/start");
    expect((await backLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);

    await backLink.click();
    await expect(page).toHaveURL(/\/start$/u);
  });

  test("account pages expose the correct parent destinations", async ({ page }) => {
    await loginAsLocalUser(page, "owner@example.test", "/profile");

    const overviewLink = page.getByRole("link", { name: "Zurück zur Übersicht" });
    await expect(overviewLink).toBeVisible();
    await expect(overviewLink).toHaveAttribute("href", "/start");

    await page.goto("/profile/delete-account");
    const accountLink = page.getByRole("link", { name: "Zurück zu Konto & Datenschutz" });
    await expect(accountLink).toBeVisible();
    await expect(accountLink).toHaveAttribute("href", "/profile");

    await accountLink.click();
    await expect(page).toHaveURL(/\/profile$/u);
  });
});
