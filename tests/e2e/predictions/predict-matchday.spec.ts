import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture, updateFixtureMatch } from "../../helpers/fixtures";

test.use({ viewport: { width: 375, height: 812 } });

test("mobile user predicts eight matches with offline retry and sees schedule changes", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const fixture = await createPredictionFixture(8);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/predictions`);
  await expect(page.getByRole("heading", { name: "Tipps abgeben" })).toBeVisible();
  const cards = page.locator(".prediction-card");
  await expect(cards).toHaveCount(8);

  await context.setOffline(true);
  await cards.nth(0).locator("input").nth(0).fill("2");
  await cards.nth(0).locator("input").nth(1).fill("1");
  await expect(cards.nth(0).getByText("Noch nicht gespeichert", { exact: true })).toBeVisible();
  await cards.nth(0).getByRole("button", { name: "Erneut versuchen" }).click();
  await context.setOffline(false);
  await expect(cards.nth(0).getByText("Gespeichert", { exact: true })).toBeVisible();

  for (let index = 1; index < 8; index += 1) {
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
  await expect(page.getByText("Gespeichert", { exact: true })).toHaveCount(8);
  await updateFixtureMatch(
    fixture.matches[6]!,
    fixture.matchdayId,
    "postponed",
    new Date(Date.now() + 172_800_000).toISOString(),
  );
  await updateFixtureMatch(fixture.matches[7]!, fixture.matchdayId, "cancelled");
  await page.reload();
  await expect(page.getByText("Verschoben", { exact: true })).toBeVisible();
  await expect(page.getByText("Abgesagt", { exact: true })).toBeVisible();
  await expect(cards.filter({ hasText: "Abgesagt" }).locator("input").first()).toBeDisabled();
});
