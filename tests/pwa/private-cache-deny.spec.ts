import { expect, test } from "@playwright/test";
test("service worker never caches private navigations or API/auth responses", async ({
  request,
}) => {
  const source = await (await request.get("/sw.js")).text();
  expect(source).toContain('request.mode === "navigate"');
  expect(source).toContain("fetch(request).catch");
  const navigationStart = source.indexOf('request.mode === "navigate"');
  const publicAssetStart = source.indexOf("if (isPublicAsset", navigationStart);
  expect(navigationStart).toBeGreaterThanOrEqual(0);
  expect(publicAssetStart).toBeGreaterThan(navigationStart);
  expect(source.slice(navigationStart, publicAssetStart)).not.toContain("cache.put");
  expect(source).not.toContain("supabase.co");
  expect(source).not.toContain("/auth/");
  expect(source).not.toContain("_rsc");
  expect(source).toContain("PUBLIC_ASSETS");
});
