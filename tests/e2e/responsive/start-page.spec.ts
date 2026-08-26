import { expect, test } from "@playwright/test";

import { loginAsLocalAppAdmin, loginAsLocalUser } from "../../helpers/admin";
import { createRoundInvitationFixture } from "../../helpers/fixtures";

test("mobile player start page is compact and offers round creation", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await loginAsLocalUser(page, "owner@example.test");

  const heading = page.getByRole("heading", { level: 1, name: "Willkommen zurück" });
  await expect(heading).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);
  await expect(page.getByRole("link", { name: "Neue Tipprunde" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zur globalen Verwaltung" })).toHaveCount(0);

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
  const administration = page.getByRole("link", { name: "Zur globalen Verwaltung" });
  await expect(administration).toBeVisible();
  await expect(administration).toHaveAttribute("href", "/admin/competitions");
  await expect(page.getByRole("link", { name: "Neue Tipprunde" })).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);

  await administration.click();
  await expect(page).toHaveURL(/\/admin\/competitions$/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);
});

test("player receives the contextual push primer only once", async ({ browserName, page }) => {
  test.skip(browserName !== "chromium", "Push permission behavior is covered in Chromium.");
  await page.addInitScript(() => {
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: class Notification {
        static permission = "default";
      },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: async () => ({
          pushManager: { getSubscription: async () => null },
        }),
      },
    });
  });
  await createRoundInvitationFixture();
  await page.setViewportSize({ width: 393, height: 659 });
  await loginAsLocalUser(page, "owner@example.test");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const dialog = page.getByRole("dialog", { name: "Keine Tippfrist mehr verpassen" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Benachrichtigungen aktivieren" })).toBeVisible();

  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(393);

  await page.setViewportSize({ width: 1_280, height: 720 });
  const desktopBox = await dialog.boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox!.width).toBeLessThanOrEqual(576);
  expect(Math.abs(desktopBox!.x - (1_280 - desktopBox!.width) / 2)).toBeLessThanOrEqual(2);

  await dialog.getByRole("button", { name: "Später" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.waitForTimeout(1_750);
  await expect(dialog).not.toBeVisible();
});
