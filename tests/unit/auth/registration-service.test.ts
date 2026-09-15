import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({ NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz.de" }),
}));
import { register, resendRegistration } from "@/features/auth/service";

function setup() {
  const auth = {
    signUp: vi
      .fn()
      .mockResolvedValue({ data: { user: { id: "new" }, session: null }, error: null }),
    resend: vi.fn().mockResolvedValue({ error: null }),
  };
  mocks.create.mockResolvedValue({ auth });
  return auth;
}
beforeEach(() => vi.clearAllMocks());

describe("registration email delivery", () => {
  it("sends new registrations to the confirmation callback with their invitation intact", async () => {
    const auth = setup();
    expect(
      await register({
        displayName: "Test",
        email: " TEST@example.test ",
        password: "Password42!",
        next: "/invite/token?from=friend",
      }),
    ).toEqual({ kind: "submitted" });
    const options = auth.signUp.mock.calls[0]![0].options;
    const callback = new URL(options.emailRedirectTo);
    expect(callback.origin).toBe("https://a-klassenhoiz.de");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("source")).toBe("register");
    expect(callback.searchParams.get("next")).toBe("/invite/token?from=friend");
    expect(auth.signUp.mock.calls[0]![0].email).toBe("test@example.test");
  });

  it("resends only signup confirmations with a trusted redirect destination", async () => {
    const auth = setup();
    await resendRegistration({
      email: " TEST@example.test ",
      next: "https://evil.test",
      type: "recovery",
    });
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "test@example.test",
      options: {
        emailRedirectTo: "https://a-klassenhoiz.de/auth/callback?next=%2Fstart&source=register",
      },
    });
  });

  it.each(["user_not_found", "email_already_confirmed", "user_already_exists"])(
    "keeps resend account status private (%s)",
    async (code) => {
      const auth = setup();
      auth.resend.mockResolvedValue({ error: { code } });
      await expect(resendRegistration({ email: "test@example.test" })).resolves.toBeUndefined();
    },
  );

  it("returns a rate-limit error and does not retry delivery automatically", async () => {
    const auth = setup();
    auth.resend.mockResolvedValue({ error: { code: "over_email_send_rate_limit" } });
    await expect(resendRegistration({ email: "test@example.test" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    expect(auth.resend).toHaveBeenCalledOnce();
  });

  it("rejects invalid email input before delivery", async () => {
    const auth = setup();
    await expect(resendRegistration({ email: "invalid" })).rejects.toThrow();
    expect(auth.resend).not.toHaveBeenCalled();
  });
});
