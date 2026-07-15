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
