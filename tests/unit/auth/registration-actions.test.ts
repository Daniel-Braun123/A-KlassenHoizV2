import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), register: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.user } }),
}));
vi.mock("@/features/auth/service", () => ({ register: mocks.register }));
import { registerAction, registrationDestinationAction } from "@/features/auth/actions";

beforeEach(() => vi.clearAllMocks());

describe("registration session resumption", () => {
  it("resumes a server-verified, confirmed matching account with its invitation", async () => {
    mocks.user.mockResolvedValue({
      data: { user: { email: "Friend@example.test", email_confirmed_at: "2026-09-15" } },
      error: null,
    });
    expect(
      await registrationDestinationAction({
        email: " FRIEND@example.test ",
        next: "/invite/friends",
      }),
    ).toBe("/invite/friends");
    expect(
      await registrationDestinationAction({
        email: "friend@example.test",
        next: "/folder/..//evil.test",
      }),
    ).toBe("/start");
  });

  it.each([
    { data: { user: null }, error: null },
    {
      data: { user: { email: "other@example.test", email_confirmed_at: "2026-09-15" } },
      error: null,
    },
    { data: { user: { email: "friend@example.test", email_confirmed_at: null } }, error: null },
    {
      data: { user: { email: "friend@example.test", email_confirmed_at: "2026-09-15" } },
      error: { message: "Invalid session" },
    },
  ])(
    "does not resume a missing, different, unconfirmed or invalid session (%#)",
    async (result) => {
      mocks.user.mockResolvedValue(result);
      expect(await registrationDestinationAction({ email: "friend@example.test" })).toBeNull();
    },
  );

  it("rejects invalid input before checking the session", async () => {
    expect(await registrationDestinationAction({ email: "invalid" })).toBeNull();
    expect(mocks.user).not.toHaveBeenCalled();
  });
});

it("returns only non-secret correction details after registration", async () => {
  mocks.register.mockResolvedValue({ kind: "submitted" });
  const form = new FormData();
  form.set("email", " FRIEND@example.test ");
  form.set("displayName", "Freund");
  form.set("password", "PrivatePassword42!");
  const result = await registerAction({ status: "idle" }, form);
  expect(result).toMatchObject({
    status: "success",
    email: "friend@example.test",
    displayName: "Freund",
  });
  expect(Object.keys(result).sort()).toEqual(["displayName", "email", "message", "status"]);
});
