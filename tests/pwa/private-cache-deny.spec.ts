import { expect, test } from "@playwright/test";
test("service worker never caches private navigations or API/auth responses", async ({
  request,
}) => {
  const source = await (await request.get("/sw.js")).text();
  expect(source).toContain('request.mode==="navigate"');
  expect(source).toContain("fetch(request).catch");
  expect(source).not.toMatch(/cache\.put\(request[^)]*\).*navigate/s);
  expect(source).not.toContain("supabase.co");
  expect(source).not.toContain("/auth/");
  expect(source).not.toContain("_rsc");
  expect(source).toContain("PUBLIC_ASSETS");
});
