import { expect, test } from "@playwright/test";

test("public home offers the normal user entry without advertising admin access", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Das Fußball-Tippspiel für dich und deine Freunde",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Schon dabei? Anmelden" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.getByRole("link", { name: "Kostenlose Tipprunde starten" })).toHaveAttribute(
    "href",
    "/register",
  );
  await expect(
    page.getByRole("heading", { level: 2, name: "So funktioniert das Fußball-Tippspiel" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Das kostenlose Fußball-Tippspiel für deine Freunde",
    }),
  ).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText(/admin/iu)).toHaveCount(0);
});
