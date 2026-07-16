import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("PWA development lifecycle", () => {
  it("registriert den Service Worker nur im Produktionsbuild und räumt Entwicklungs-Caches auf", () => {
    const source = readFileSync("app/layout.tsx", "utf8");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain("navigator.serviceWorker.getRegistrations");
    expect(source).toContain("registration.unregister()");
    expect(source).toContain('key.startsWith("aklassenhoiz-")');
  });
});
