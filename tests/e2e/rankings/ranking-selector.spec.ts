import { expect, test } from "@playwright/test";

import { loginAsLocalUser } from "../../helpers/admin";
import { createPredictionFixture } from "../../helpers/fixtures";

test.use({ viewport: { width: 375, height: 812 } });

test("one dropdown switches between overall and matchday rankings", async ({ page }) => {
  const fixture = await createPredictionFixture(1);
  await loginAsLocalUser(page, "owner@example.test", `/rounds/${fixture.roundId}/rankings`);

  const selector = page.getByRole("combobox", { name: "Rangliste" });
  await expect(selector).toHaveValue("overall");
  await expect(selector.getByRole("option")).toHaveCount(2);
  await expect(page.locator(".ranking-section")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Gesamt", exact: true })).toBeVisible();

  await selector.selectOption(fixture.matchdayId);
  await expect(page).toHaveURL(
    new RegExp(`/rounds/${fixture.roundId}/rankings\\?matchday=${fixture.matchdayId}$`),
  );
  await expect(page.getByRole("heading", { name: "Hinrunde · Spieltag 1" })).toBeVisible();
  await expect(page.locator(".ranking-section")).toHaveCount(1);

  await page.getByRole("combobox", { name: "Rangliste" }).selectOption("overall");
  await expect(page).toHaveURL(new RegExp(`/rounds/${fixture.roundId}/rankings$`));
  await expect(page.getByRole("heading", { name: "Gesamt", exact: true })).toBeVisible();
});
