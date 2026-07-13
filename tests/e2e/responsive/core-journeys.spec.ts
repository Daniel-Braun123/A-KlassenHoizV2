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
    for (const path of ["", "/predictions", "/rankings", "/results"]) {
      await page.goto("/rounds/" + fixture.roundId + path);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
