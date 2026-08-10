import { expect, test } from "@playwright/test";

import { waitForLocalConfirmationLink } from "../../helpers/local-database";

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

test("a completed password reset returns to normal sign-in", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `reset-${suffix}@example.test`;
  const originalPassword = "VorherSicher42!";
  const newPassword = "JetztSicher43!";

  await page.goto("/register");
  await page.getByLabel("Anzeigename").fill(`Reset ${suffix}`);
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill(originalPassword);
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await page.goto(await waitForLocalConfirmationLink(email));
  await expect(page).toHaveURL(/\/start$/);

  await page.goto("/password/forgot");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByRole("button", { name: "Link anfordern" }).click();
  await expect(page.getByRole("status")).toContainText("erhältst du gleich eine E-Mail");
  await page.goto(await waitForLocalConfirmationLink(email, "recovery"));
  await expect(page.getByRole("heading", { name: "Neues Passwort festlegen" })).toBeVisible();

  await page.locator('input[name="password"]').fill(newPassword);
  await page.locator('input[name="passwordConfirmation"]').fill(newPassword);
  await page.getByRole("button", { name: "Passwort speichern" }).click();

  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  await expect(page.getByRole("status")).toHaveText(
    "Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an.",
  );
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill(originalPassword);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(
    page.getByText("E-Mail-Adresse oder Passwort stimmen nicht.", { exact: false }),
  ).toBeVisible();

  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill(newPassword);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/start$/);
});
