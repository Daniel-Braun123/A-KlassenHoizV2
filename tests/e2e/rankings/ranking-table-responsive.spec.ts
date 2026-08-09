import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";

test("five ranking columns fit mobile and desktop viewports without overflow", async ({ page }) => {
  const fixture = await createPredictionFixture(1);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/rankings`);

  await expect(page.getByRole("columnheader")).toHaveCount(5);
  await expect(page.getByRole("columnheader", { name: "Exakte Ergebnisse" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Gewertete Tipps" })).toBeVisible();

  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: Math.max(640, Math.round(width * 0.8)) });

    const layout = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>(".ranking-table-wrap");
      const table = document.querySelector<HTMLElement>(".ranking-table");
      if (!wrapper || !table) throw new Error("Ranking table is missing");
      const wrapperBox = wrapper.getBoundingClientRect();
      const tableBox = table.getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tableLeftDelta: tableBox.left - wrapperBox.left,
        tableRightDelta: tableBox.right - wrapperBox.right,
      };
    });

    expect(layout.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    expect(layout.tableLeftDelta, `${width}px table left edge`).toBeGreaterThanOrEqual(-1);
    expect(layout.tableRightDelta, `${width}px table right edge`).toBeLessThanOrEqual(1);

    const shortLabel = page.locator(".ranking-table__label--short").first();
    const longLabel = page.locator(".ranking-table__label--long").first();
    if (width < 640) {
      await expect(shortLabel).toBeVisible();
      await expect(longLabel).toBeHidden();
    } else {
      await expect(shortLabel).toBeHidden();
      await expect(longLabel).toBeVisible();
    }
  }
});
