import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsLocalAppAdmin } from "../helpers/admin";

for (const route of ["/admin/competitions", "/admin/clubs", "/admin/schedule", "/admin/results"]) {
  test(`${route} has no detectable WCAG 2.2 AA violation`, async ({ page }) => {
    await loginAsLocalAppAdmin(page);
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
