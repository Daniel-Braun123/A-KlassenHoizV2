import { describe, expect, it } from "vitest";

import { readPublicEnvironment, readServerEnvironment } from "@/lib/config/env";

const validPublicEnvironment = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
};

const supabaseBrowserEnvironment = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
};

describe("environment configuration", () => {
  it("accepts the documented local public variables", () => {
    expect(readPublicEnvironment(validPublicEnvironment)).toEqual(supabaseBrowserEnvironment);
  });

  it("keeps the server secret optional and server-only", () => {
    expect(readServerEnvironment(validPublicEnvironment)).toEqual(validPublicEnvironment);
  });

  it("derives the server-only site URL from the immutable Vercel deployment host", () => {
    expect(
      readServerEnvironment({
        ...supabaseBrowserEnvironment,
        VERCEL_URL: "a-klassenhoiz-preview.vercel.app",
      }),
    ).toEqual({
      ...supabaseBrowserEnvironment,
      NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz-preview.vercel.app",
    });
  });

  it("does not accept a path or scheme as a Vercel deployment host", () => {
    expect(() =>
      readServerEnvironment({
        ...supabaseBrowserEnvironment,
        VERCEL_URL: "evil.example/path",
      }),
    ).toThrow();
  });

  it("rejects missing public configuration", () => {
    expect(() => readPublicEnvironment({})).toThrow();
  });
});
