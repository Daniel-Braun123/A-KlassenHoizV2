import { expect, test } from "@playwright/test";
import { waitForLocalConfirmationLink } from "../../helpers/local-database";

test("a signup email signs in a fresh browser and remains signed in after reload", async ({
  page,
  browser,
}) => {
  const email = `cross-browser-${crypto.randomUUID().slice(0, 8)}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Anzeigename").fill("Neues Mitglied");
  await page.getByRole("textbox", { name: "E-Mail-Adresse", exact: true }).fill(email);
  await page.locator('input[name="password"]').fill("LocalConfirmation42!");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByRole("heading", { name: "Bestätige deine E-Mail-Adresse" })).toBeVisible();
  const link = await waitForLocalConfirmationLink(email);
  expect(new URL(link).searchParams.has("token_hash")).toBe(true);
  const emailBrowser = await browser.newContext();
  try {
    expect(await emailBrowser.cookies()).toEqual([]);
    const emailPage = await emailBrowser.newPage();
    await emailPage.goto(link);
    await expect(emailPage).toHaveURL(/\/start$/);
    await emailPage.reload();
    await expect(emailPage).toHaveURL(/\/start$/);
    await expect(emailPage.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible();
  } finally {
    await emailBrowser.close();
  }
});

test("correction keeps the invitation, clears the password and sends to the corrected address", async ({
  page,
}) => {
  const email = `correct-${crypto.randomUUID().slice(0, 8)}@example.test`;
  await page.goto("/register?next=%2Finvite%2Ffriends");
  await page.getByLabel("Anzeigename").fill("Mitglied");
  await page.getByRole("textbox", { name: "E-Mail-Adresse", exact: true }).fill(`typo-${email}`);
  await page.locator('input[name="password"]').fill("LocalConfirmation42!");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await page.getByRole("button", { name: "E-Mail-Adresse korrigieren" }).click();
  await expect(page.locator('input[name="password"]')).toHaveValue("");
  await expect(page.getByLabel("Anzeigename")).toHaveValue("Mitglied");
  await page.getByRole("textbox", { name: "E-Mail-Adresse", exact: true }).fill(email);
  await page.locator('input[name="password"]').fill("LocalConfirmation42!");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  const link = new URL(await waitForLocalConfirmationLink(email));
  expect(link.searchParams.get("next")).toBe("/invite/friends");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
});
