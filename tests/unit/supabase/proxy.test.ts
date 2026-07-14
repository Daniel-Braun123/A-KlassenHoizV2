import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/config/env", () => ({
  readPublicEnvironment: () => ({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-key",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  }),
}));

import { updateSession } from "@/lib/supabase/proxy";

describe("Supabase session proxy", () => {
  beforeEach(() => {
    mocks.createServerClient.mockReset();
  });

  it("forwards refreshed cookies and mandatory no-cache headers", async () => {
    mocks.createServerClient.mockImplementation((_url, _key, options) => ({
      auth: {
        getClaims: async () => {
          options.cookies.setAll(
            [{ name: "sb-session", value: "refreshed", options: { httpOnly: true } }],
            {
              "Cache-Control": "private, no-store",
              Expires: "0",
              Pragma: "no-cache",
            },
          );
          return { data: null, error: null };
        },
      },
    }));

    const response = await updateSession(new NextRequest("http://localhost/start"));

    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });
});
