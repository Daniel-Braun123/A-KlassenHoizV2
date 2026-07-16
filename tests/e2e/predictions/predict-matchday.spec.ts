import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";

test.use({ viewport: { width: 375, height: 812 } });

test("mobile user collects eight predictions and saves them together with offline retry", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const fixture = await createPredictionFixture(8);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  await expect(page.getByRole("heading", { name: "Tipps abgeben" })).toBeVisible();
  const cards = page.locator(".prediction-card");
  await expect(cards).toHaveCount(8);
  await expect(page.getByRole("combobox", { name: "Spieltag" })).toBeVisible();
  const firstCardBox = await cards.first().boundingBox();
  const firstScoreBox = await cards.first().locator("input").first().boundingBox();
  const secondScoreBox = await cards.first().locator("input").nth(1).boundingBox();
  expect(firstCardBox?.height).toBeLessThanOrEqual(80);
  expect(Math.abs((firstScoreBox?.y ?? 0) - (secondScoreBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect((secondScoreBox?.x ?? 0) - (firstScoreBox?.x ?? 0)).toBeGreaterThan(48);

  await context.setOffline(true);
  for (let index = 0; index < 8; index += 1) {
    await cards
      .nth(index)
      .locator("input")
      .nth(0)
      .fill(String(index % 4));
    await cards
      .nth(index)
      .locator("input")
      .nth(1)
      .fill(String((index + 1) % 3));
  }
  await expect(page.getByText("Gespeichert", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tipps speichern" }).click();
  await expect(page.getByText("Das hat gerade nicht funktioniert.")).toBeVisible();

  await context.setOffline(false);
  await page.getByRole("button", { name: "Tipps speichern" }).click();
  await expect(page.getByText("8 Tipps wurden gespeichert.")).toBeVisible();
  await expect(page.getByText("Alle eingegebenen Tipps sind gespeichert")).toBeVisible();
});
