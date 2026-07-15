import { expect, test } from "@playwright/test";

import { loginAsLocalAppAdmin, loginAsLocalUser } from "../../helpers/admin";

test("authenticated mobile shell has one header and an account menu", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await loginAsLocalUser(page, "owner@example.test");

  await expect(page.locator(".app-header")).toHaveCount(1);
  await expect(page.locator(".app-brand__logo")).toBeVisible();
  await expect(page.locator(".app-brand__logo")).toHaveAttribute("src", /app-icon\.svg/);
  await expect(page.locator(".account-navigation")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Profil", exact: true })).toHaveCount(0);

  const trigger = page.getByRole("button", { name: "Profilmenü öffnen" });
  await expect(trigger).toBeVisible();
  const box = await trigger.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);

  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Profil und Darstellung" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Konto & Datenschutz/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abmelden" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Verwaltung/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Dunkel" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("ak-theme:v1"))).toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS("color-scheme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("desktop admin shell keeps administration out of the profile menu", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsLocalAppAdmin(page);

  await expect(page.locator(".app-header")).toHaveCount(1);
  await expect(page.locator(".account-navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Profilmenü öffnen" }).click();
  await expect(page.getByText("Administratorkonto")).toBeVisible();
  await expect(page.getByRole("link", { name: /Verwaltung/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abmelden" })).toBeVisible();
});
