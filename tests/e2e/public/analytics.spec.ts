import { expect, test } from "@playwright/test";

test("public navigation keeps one Web Analytics script mounted", async ({ page }) => {
  // Local CI has no Vercel intake route. Observe the actual SDK's injection
  // without sending synthetic page views to the production analytics project.
  await page.route("**/_vercel/insights/script.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  const response = await page.goto("/register");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin");
  const analyticsScript = page.locator('script[data-sdkn="@vercel/analytics/next"]');
  await expect(analyticsScript).toHaveCount(1);
  await expect(analyticsScript).toHaveAttribute("src", "/_vercel/insights/script.js");
  await page.getByRole("link", { name: "Schon registriert? Anmelden" }).click();
  await expect(page).toHaveURL(/\/login$/u);
  await expect(analyticsScript).toHaveCount(1);
});
