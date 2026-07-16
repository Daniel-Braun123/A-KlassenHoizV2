import { expect, type Page } from "@playwright/test";

export async function loginAsLocalAppAdmin(page: Page): Promise<void> {
  await page.goto("/login?next=/admin/competitions");
  await page.getByLabel("E-Mail-Adresse").fill("app-admin@example.test");
  await page.locator('input[name="password"]').fill("LocalFixture42!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/admin\/competitions$/);
  await expect(page.getByRole("heading", { level: 1, name: "Globale Fußballdaten" })).toBeVisible();
}

export async function loginAsLocalUser(
  page: Page,
  email: string,
  next: string = "/start",
): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill("LocalFixture42!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(new RegExp(`${next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}
