import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../../../next.config";

describe("application security headers", () => {
  it("applies CSP and browser hardening to every route", async () => {
    const configured = await nextConfig.headers!();
    expect(configured).toEqual([{ source: "/(.*)", headers: securityHeaders }]);
    const headers = Object.fromEntries(securityHeaders.map(({ key, value }) => [key, value]));
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Permissions-Policy"]).toContain("payment=()");
  });
});
