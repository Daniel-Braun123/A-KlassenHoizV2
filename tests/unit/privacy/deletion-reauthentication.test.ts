import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), cookies: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({
    NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz.de",
    SUPABASE_SECRET_KEY: "test-only-signing-key-not-for-production",
  }),
}));
import {
  completeGoogleDeletionVerification,
  hasGoogleDeletionVerification,
  startGoogleDeletionVerification,
} from "@/features/privacy/reauthentication";

function setup() {
  const values = new Map<string, string>();
  const jar = {
    get: vi.fn((name: string) => (values.has(name) ? { value: values.get(name) } : undefined)),
    set: vi.fn((name: string, value: string, options: unknown) => {
      void options;
      values.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      values.delete(name);
    }),
  };
  mocks.cookies.mockResolvedValue(jar);
  const user = { id: "own-user", email: "own@example.test", identities: [{ provider: "google" }] };
  const session = { userId: user.id, id: "original-session" };
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    getClaims: vi.fn().mockImplementation(async () => ({
      data: { claims: { sub: session.userId, session_id: session.id } },
      error: null,
    })),
    signInWithOAuth: vi
      .fn()
      .mockResolvedValue({ data: { url: "https://accounts.google.com/test" }, error: null }),
    exchangeCodeForSession: vi.fn().mockImplementation(async () => {
      session.id = "new-google-session";
      return { data: { user }, error: null };
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const supabase = { auth };
  mocks.create.mockResolvedValue(supabase);
  const nonce = () =>
    new URL(auth.signInWithOAuth.mock.calls[0]![0].options.redirectTo).searchParams.get("nonce");
  return { values, jar, auth, session, supabase, nonce };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());
describe("Google deletion verification", () => {
  it("requires a fresh OAuth return before granting verification, bound to the new session", async () => {
    const { jar, auth, nonce, supabase, session } = setup();
    expect(await startGoogleDeletionVerification()).toBe("https://accounts.google.com/test");
    expect(jar.set.mock.calls[0]![2]).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
    });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        options: expect.objectContaining({
          queryParams: { prompt: "select_account", login_hint: "own@example.test" },
        }),
      }),
    );
    expect(await hasGoogleDeletionVerification(supabase as never, "own-user")).toBe(false);
    expect(await completeGoogleDeletionVerification("fresh-code", nonce())).toBe(
      "/profile/delete-account",
    );
    expect(await hasGoogleDeletionVerification(supabase as never, "own-user")).toBe(true);
    expect(await hasGoogleDeletionVerification(supabase as never, "other-user")).toBe(false);
    session.id = "another-login-session";
    expect(await hasGoogleDeletionVerification(supabase as never, "own-user")).toBe(false);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("rejects a forged cookie without exchanging any code", async () => {
    const { values, auth, nonce } = setup();
    await startGoogleDeletionVerification();
    const [name, value] = [...values][0]!;
    const [payload, signature] = value.split(".");
    const changed = {
      ...JSON.parse(Buffer.from(payload!, "base64url").toString()),
      userId: "other-user",
    };
    values.set(name, `${Buffer.from(JSON.stringify(changed)).toString("base64url")}.${signature}`);
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "verification=error",
    );
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("rejects callbacks without a pending request", async () => {
    const { auth } = setup();
    expect(await completeGoogleDeletionVerification("code", "invented")).toContain(
      "verification=error",
    );
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it.each(["wrong-nonce", null])("rejects a mismatched or missing nonce (%s)", async (nonce) => {
    const { auth } = setup();
    await startGoogleDeletionVerification();
    expect(await completeGoogleDeletionVerification("code", nonce)).toContain("verification=error");
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("clears confirmation on cancellation and permits starting again", async () => {
    const { auth, nonce, values } = setup();
    await startGoogleDeletionVerification();
    expect(await completeGoogleDeletionVerification(null, nonce())).toContain("verification=error");
    expect(values.size).toBe(0);
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    await expect(startGoogleDeletionVerification()).resolves.toContain("accounts.google.com");
  });

  it("rejects an expired pending request", async () => {
    vi.useFakeTimers();
    const { auth, nonce } = setup();
    await startGoogleDeletionVerification();
    vi.advanceTimersByTime(600_001);
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "verification=error",
    );
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("expires a completed confirmation after ten minutes", async () => {
    vi.useFakeTimers();
    const { nonce, supabase } = setup();
    await startGoogleDeletionVerification();
    await completeGoogleDeletionVerification("code", nonce());
    vi.advanceTimersByTime(600_001);
    expect(await hasGoogleDeletionVerification(supabase as never, "own-user")).toBe(false);
  });

  it("rejects a changed original session before exchanging a code", async () => {
    const { auth, nonce, session } = setup();
    await startGoogleDeletionVerification();
    session.id = "unrelated-session";
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "verification=error",
    );
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("signs out a different selected account and never grants deletion permission", async () => {
    const { auth, nonce, values } = setup();
    await startGoogleDeletionVerification();
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "other-user", identities: [{ provider: "google" }] } },
      error: null,
    });
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "delete-account-mismatch",
    );
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(values.size).toBe(0);
  });

  it("does not grant verification when code exchange fails", async () => {
    const { auth, nonce, values } = setup();
    await startGoogleDeletionVerification();
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_grant" },
    });
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "verification=error",
    );
    expect(values.size).toBe(0);
  });

  it("does not reuse a completed OAuth request", async () => {
    const { auth, nonce } = setup();
    await startGoogleDeletionVerification();
    await completeGoogleDeletionVerification("code", nonce());
    expect(await completeGoogleDeletionVerification("code", nonce())).toContain(
      "verification=error",
    );
    expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  });

  it("does not trust editable provider metadata", async () => {
    const { auth } = setup();
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "own-user",
          identities: [{ provider: "email" }],
          user_metadata: { provider: "google" },
        },
      },
      error: null,
    });
    await expect(startGoogleDeletionVerification()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });
});
