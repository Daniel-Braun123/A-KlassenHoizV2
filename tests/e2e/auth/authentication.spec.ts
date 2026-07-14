import { expect, test } from "@playwright/test";

test.describe("mobile authentication", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("register, login and reset surfaces preserve invitation context", async ({ page }) => {
    await page.goto("/register?next=/invite/example-token");
    await expect(page.getByRole("heading", { name: "Konto erstellen" })).toBeVisible();
    await expect(page.getByLabel("Anzeigename")).toBeVisible();
    await expect(page.getByLabel("E-Mail-Adresse")).toHaveAttribute("autocomplete", "email");
    const password = page.locator('input[name="password"]');
    await expect(password).toHaveAccessibleName("Passwort");
    await expect(password).toHaveAttribute("autocomplete", "new-password");
    await expect(page.getByRole("link", { name: "Schon registriert? Anmelden" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Fexample-token",
    );

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible();
    await page.getByRole("link", { name: "Passwort vergessen" }).click();
    await expect(page).toHaveURL(/\/password\/forgot$/);
    await expect(page.getByRole("heading", { name: "Passwort zurücksetzen" })).toBeVisible();
  });
});
