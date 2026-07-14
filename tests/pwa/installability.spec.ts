import { expect, test } from "@playwright/test";
test("manifest, icons, service worker and offline fallback are complete", async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: "A-KlassenHoiz – private Tipprunden",
    display: "standalone",
    start_url: "/start",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/sw.js")).ok()).toBe(true);
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Du bist offline" })).toBeVisible();
});
