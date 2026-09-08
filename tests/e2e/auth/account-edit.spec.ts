import { expect, test } from "@playwright/test";
import { waitForLocalConfirmationLink } from "../../helpers/local-database";

test("account name, confirmed email change and password change preserve the account", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl || !["127.0.0.1", "localhost"].includes(new URL(configuredUrl).hostname)) {
    throw new Error("Account editing browser tests require the local Supabase test stack.");
  }
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `account-edit-${suffix}@example.test`;
  const newEmail = `account-edited-${suffix}@example.test`;
  const password = "VorherSicher42!";
  const newPassword = "NachherSicher43!";

  await page.goto("/register");
  await page.getByLabel("Anzeigename").fill(`Konto ${suffix}`);
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await waitForLocalConfirmationLink(email));
  await expect(page).toHaveURL(/\/start$/);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Anzeigename ändern" }).click();
  await page.getByLabel("Neuer Anzeigename").fill(`Geändert ${suffix}`);
  await page.getByRole("button", { name: "Änderung speichern" }).click();
  await expect(page.getByRole("status")).toContainText("Anzeigename wurde gespeichert");
  await expect(page.getByText(`Geändert ${suffix}`, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Geändert ${suffix}`, { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("account-details.png"), fullPage: true });

  await page.getByRole("button", { name: "E-Mail-Adresse ändern" }).click();
  await page.getByLabel("Neue E-Mail-Adresse").fill(newEmail);
  await page.getByLabel("Aktuelles Passwort").fill("FalschesPasswort42!");
  await page.getByRole("button", { name: "Bestätigung anfordern" }).click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText(
    "aktuelle Passwort stimmt nicht",
  );
  await expect(page.getByLabel("Neue E-Mail-Adresse")).toHaveValue(newEmail);
  await page.getByLabel("Aktuelles Passwort").fill(password);
  await page.getByRole("button", { name: "Bestätigung anfordern" }).click();
  await expect(
    page.getByText(`Bestätigung ausstehend für ${newEmail}`, { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  const oldAddressConfirmation = await waitForLocalConfirmationLink(email, "email_change");
  const newAddressConfirmation = await waitForLocalConfirmationLink(newEmail, "email_change");
  await page.goto(oldAddressConfirmation);
  await page.goto("/profile");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.goto(newAddressConfirmation);
  await page.goto("/profile");
  await expect(page.getByText(newEmail, { exact: true })).toBeVisible();
  await expect(page.getByText(/Bestätigung ausstehend für/)).toHaveCount(0);
  await expect(page.getByText(`Geändert ${suffix}`, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Passwort ändern" }).click();
  await page.screenshot({ path: testInfo.outputPath("account-password-form.png"), fullPage: true });
  await expect(page.locator('input[name="currentPassword"]')).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
  await page.getByLabel("Aktuelles Passwort").fill("FalschesPasswort42!");
  await page.locator('input[name="password"]').fill(newPassword);
  await page.getByLabel("Neues Passwort wiederholen").fill(newPassword);
  await page.getByRole("button", { name: "Änderung speichern" }).click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText(
    "aktuelle Passwort stimmt nicht",
  );
  await page.getByLabel("Aktuelles Passwort").fill(password);
  await page.locator('input[name="password"]').fill(newPassword);
  await page.getByLabel("Neues Passwort wiederholen").fill(newPassword);
  await page.getByRole("button", { name: "Änderung speichern" }).click();
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  await page.getByLabel("E-Mail-Adresse").fill(newEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(
    page.getByText("E-Mail-Adresse oder Passwort stimmen nicht.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("E-Mail-Adresse").fill(newEmail);
  await page.locator('input[name="password"]').fill(newPassword);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/start$/);
  await page.goto("/profile");
  await expect(page.getByText(`Geändert ${suffix}`, { exact: true })).toBeVisible();
  await expect(page.getByText(newEmail, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
