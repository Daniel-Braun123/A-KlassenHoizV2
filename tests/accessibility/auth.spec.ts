import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/register", "/login", "/password/forgot", "/password/reset"]) {
  test(`${route} has no detectable WCAG 2.2 AA violation`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
