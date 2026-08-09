import { expect, test } from "@playwright/test";

const expectedTitle = "Fußball-Tippspiel mit Freunden – kostenlos | A-KlassenHoiz";
const expectedDescription =
  "Erstelle kostenlos eine private Fußball-Tipprunde, lade Freunde ein und tippt gemeinsam Spiele. Einfach eingerichtet, privat und bis zum Anpfiff flexibel.";

test("public homepage exposes complete indexable metadata and matching structured data", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(expectedTitle);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    expectedDescription,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", expectedTitle);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    expectedDescription,
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "de_DE");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBeTruthy();
  expect(new URL(canonical!).pathname).toBe("/");
  expect(new URL(canonical!).search).toBe("");

  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  ) as { "@graph": Array<{ "@type": string }> };
  expect(graph["@graph"].map((item) => item["@type"])).toEqual([
    "WebSite",
    "WebApplication",
    "FAQPage",
  ]);

  const socialImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(socialImage).toBeTruthy();
  const socialImageResponse = await request.get(socialImage!);
  expect(socialImageResponse.ok()).toBe(true);
  expect(socialImageResponse.headers()["content-type"]).toContain("image/png");
});

test("robots and sitemap expose only the public landing page", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robots = await robotsResponse.text();
  expect(robots).toContain("User-Agent: *");
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /rounds");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(locations).toHaveLength(1);
  expect(new URL(locations[0]!).pathname).toBe("/");
  expect(sitemap).not.toMatch(/login|register|password|rounds|admin/);
});

test("utility pages are noindex and unknown routes return a real 404", async ({ page }) => {
  for (const path of ["/login", "/register", "/password/forgot", "/offline"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);
  }

  const response = await page.goto("/seo-check-this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Diese Seite gibt es nicht" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute("href", "/");
});

test("all public landing-page links resolve", async ({ page, request }) => {
  await page.goto("/");
  const paths = await page
    .locator('main a[href^="/"]')
    .evaluateAll((links) =>
      [...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")))].filter(
        (href): href is string => Boolean(href),
      ),
    );

  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), `${path} must resolve`).toBeLessThan(400);
  }
});
