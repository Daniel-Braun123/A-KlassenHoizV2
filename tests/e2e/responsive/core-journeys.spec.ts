import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";
test.describe.configure({ mode: "parallel" });
for (const width of [320, 375, 768, 1024, 1440])
  test(`core round journey has no page overflow at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    const fixture = await createPredictionFixture(1);
    await page.setViewportSize({ width, height: Math.max(640, Math.round(width * 0.9)) });
    await loginAsLocalUser(page, "owner@example.test", "/rounds/" + fixture.roundId);
    await expect(page.getByRole("link", { name: "Rangliste", exact: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Ergebnisse", exact: true })).toHaveCount(1);

    const navigationBox = await page.locator(".round-navigation").boundingBox();
    const contentBox = await page.locator(".content-page").boundingBox();
    expect(navigationBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    if (width >= 1024) {
      expect(navigationBox!.x).toBeLessThan(contentBox!.x);
      expect(navigationBox!.width).toBeLessThan(contentBox!.width);

      const navigationItems = await page.locator(".round-navigation li").evaluateAll((items) =>
        items.map((item) => {
          const rect = item.getBoundingClientRect();
          return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
        }),
      );
      for (let index = 1; index < navigationItems.length; index += 1) {
        expect(navigationItems[index]!.top).toBeGreaterThanOrEqual(
          navigationItems[index - 1]!.bottom,
        );
        expect(navigationItems[index]!.left).toBeCloseTo(navigationItems[0]!.left, 0);
        expect(navigationItems[index]!.right).toBeCloseTo(navigationItems[0]!.right, 0);
      }
      expect(
        await page
          .locator(".round-navigation")
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
    } else {
      expect(navigationBox!.y + navigationBox!.height).toBeGreaterThanOrEqual(
        Math.max(640, Math.round(width * 0.9)) - 1,
      );
    }

    for (const path of ["", "/predictions", "/rankings", "/results"]) {
      await page.goto("/rounds/" + fixture.roundId + path);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
