import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ complete: vi.fn(), exchange: vi.fn() }));
vi.mock("@/features/privacy/reauthentication", () => ({
  completeGoogleDeletionVerification: mocks.complete,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchange } }),
}));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({ NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz.de" }),
}));
import { GET } from "@/app/auth/callback/route";

beforeEach(() => vi.resetAllMocks());

it("routes deletion OAuth through its bound verifier and ignores an injected next destination", async () => {
  mocks.complete.mockResolvedValue("/profile/delete-account");
  const response = await GET(
    new NextRequest(
      "https://a-klassenhoiz.de/auth/callback?source=delete-account&code=code&nonce=nonce&next=https://evil.test",
    ),
  );
  expect(mocks.complete).toHaveBeenCalledWith("code", "nonce");
  expect(mocks.exchange).not.toHaveBeenCalled();
  expect(response.headers.get("location")).toBe("https://a-klassenhoiz.de/profile/delete-account");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
});

it("shows a recoverable error without exposing internal failures", async () => {
  mocks.complete.mockRejectedValue(new Error("secret internal error"));
  const response = await GET(
    new NextRequest(
      "https://a-klassenhoiz.de/auth/callback?source=delete-account&error=access_denied",
    ),
  );
  expect(mocks.complete).toHaveBeenCalledWith(null, null);
  expect(response.headers.get("location")).toBe(
    "https://a-klassenhoiz.de/profile/delete-account?verification=error",
  );
});

it("keeps normal login callbacks working", async () => {
  mocks.exchange.mockResolvedValue({ error: null });
  const response = await GET(
    new NextRequest("https://a-klassenhoiz.de/auth/callback?source=login&code=code&next=/profile"),
  );
  expect(mocks.complete).not.toHaveBeenCalled();
  expect(mocks.exchange).toHaveBeenCalledWith("code");
  expect(response.headers.get("location")).toBe("https://a-klassenhoiz.de/profile");
});

it("preserves registration and email-change failure destinations", async () => {
  const registration = await GET(
    new NextRequest("https://a-klassenhoiz.de/auth/callback?source=register"),
  );
  expect(registration.headers.get("location")).toBe(
    "https://a-klassenhoiz.de/register?error=oauth",
  );
  const emailChange = await GET(
    new NextRequest("https://a-klassenhoiz.de/auth/callback?source=email-change"),
  );
  expect(emailChange.headers.get("location")).toBe(
    "https://a-klassenhoiz.de/profile?emailChange=error",
  );
});
