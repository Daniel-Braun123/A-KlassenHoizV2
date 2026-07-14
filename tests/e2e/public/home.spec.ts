import { expect, test } from "@playwright/test";

test("public home offers the normal user entry without advertising admin access", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Eure Liga. Eure Runde. Eure Tipps." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Anmelden" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Kostenloses Konto erstellen" })).toHaveAttribute(
    "href",
    "/register",
  );
  await expect(
    page.getByRole("heading", { level: 2, name: "In drei Schritten dabei" }),
  ).toBeVisible();
  await expect(page.getByText(/admin/iu)).toHaveCount(0);
});
