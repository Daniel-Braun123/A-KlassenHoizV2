import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), exchange: vi.fn() }));
vi.mock("@/features/privacy/reauthentication", () => ({
  completeGoogleDeletionVerification: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { verifyOtp: mocks.verify, exchangeCodeForSession: mocks.exchange },
  }),
}));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({ NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz.de" }),
}));
import { GET } from "@/app/auth/callback/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue({
    data: { user: { id: "new" }, session: { access_token: "test" } },
    error: null,
  });
});
const token = "a".repeat(56);

describe("signup confirmation callback", () => {
  it("creates a session using the email token in a fresh browser without any PKCE cookie", async () => {
    const request = new NextRequest(
      `https://a-klassenhoiz.de/auth/callback?source=register&token_hash=${token}&next=%2Finvite%2Ffriends%3Ffrom%3Demail`,
    );
    expect(request.cookies.getAll()).toEqual([]);
    const response = await GET(request);
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: token, type: "email" });
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://a-klassenhoiz.de/invite/friends?from=email",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("location")).not.toContain(token);
  });

  it.each(["https://evil.test", "//evil.test", "/folder/..//evil.test", "/\\evil.test"])(
    "blocks external destinations (%s)",
    async (next) => {
      const response = await GET(
        new NextRequest(
          `https://a-klassenhoiz.de/auth/callback?source=register&token_hash=${token}&next=${encodeURIComponent(next)}`,
        ),
      );
      expect(response.headers.get("location")).toBe("https://a-klassenhoiz.de/start");
    },
  );

  it("offers a new link after expiration without exposing the email token", async () => {
    mocks.verify.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "otp_expired" },
    });
    const response = await GET(
      new NextRequest(
        `https://a-klassenhoiz.de/auth/callback?source=register&token_hash=${token}&next=%2Finvite%2Ffriends`,
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://a-klassenhoiz.de/register?error=confirmation&next=%2Finvite%2Ffriends",
    );
  });

  it("does not accept an empty token or a user without an authenticated session", async () => {
    const empty = await GET(
      new NextRequest("https://a-klassenhoiz.de/auth/callback?source=register&token_hash="),
    );
    expect(empty.headers.get("location")).toContain("error=confirmation");
    expect(mocks.verify).not.toHaveBeenCalled();
    mocks.verify.mockResolvedValue({ data: { user: { id: "new" }, session: null }, error: null });
    const response = await GET(
      new NextRequest(`https://a-klassenhoiz.de/auth/callback?source=register&token_hash=${token}`),
    );
    expect(response.headers.get("location")).toContain("error=confirmation");
  });

  it("keeps previously issued PKCE confirmation links working", async () => {
    mocks.exchange.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest("https://a-klassenhoiz.de/auth/callback?source=register&code=legacy-code"),
    );
    expect(mocks.exchange).toHaveBeenCalledWith("legacy-code");
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://a-klassenhoiz.de/start");
  });
});
