import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../helpers/admin";
import { createPredictionFixture } from "../helpers/fixtures";

test("prediction inputs, live save status and focus are WCAG 2.2 AA compatible", async ({
  page,
}) => {
  const fixture = await createPredictionFixture(2);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  await expect(page.getByLabel(`Tore ${fixture.matches[0]!.homeName}`)).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
