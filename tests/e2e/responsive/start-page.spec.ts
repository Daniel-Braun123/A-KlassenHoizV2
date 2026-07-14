import { expect, test } from "@playwright/test";

import { loginAsLocalAppAdmin, loginAsLocalUser } from "../../helpers/admin";

test("mobile player start page is compact and offers round creation", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await loginAsLocalUser(page, "owner@example.test");

  const heading = page.getByRole("heading", { level: 1, name: "Willkommen zurück" });
  await expect(heading).toBeVisible();
  await expect(page.getByRole("link", { name: "Neue Tipprunde" })).toBeVisible();

  const fontSize = await heading.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(fontSize).toBeLessThanOrEqual(32);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("app admin start page only offers global administration", async ({ page }) => {
  await loginAsLocalAppAdmin(page);
  await page.goto("/start");

  await expect(page.getByRole("heading", { level: 1, name: "Globale Verwaltung" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Verwaltung" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Neue Tipprunde" })).toHaveCount(0);
});
