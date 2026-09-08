import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({ NEXT_PUBLIC_SITE_URL: "https://a-klassenhoiz.de" }),
}));
import {
  changeAccountEmail,
  changeAccountPassword,
  changeDisplayName,
} from "@/features/profile/account-edit-service";

function setup(providers = ["email"]) {
  const user = {
    id: "own-user",
    email: "current@example.test",
    identities: providers.map((provider) => ({ provider })),
    user_metadata: { providers: ["email"] },
  };
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const maybeSingle = vi.fn().mockResolvedValue({ data: { status: "active" }, error: null });
  const rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
  mocks.create.mockResolvedValue({
    auth,
    schema: () => ({ rpc, from: () => ({ select: () => ({ maybeSingle }) }) }),
  });
  return { auth, rpc, maybeSingle };
}

beforeEach(() => vi.clearAllMocks());
describe("account edits", () => {
  it("updates only the caller's display name through the existing RPC", async () => {
    const { rpc, auth } = setup(["google"]);
    await changeDisplayName({
      displayName: "  Neuer Name  ",
      userId: "someone-else",
      role: "admin",
    });
    expect(rpc).toHaveBeenCalledWith("update_my_profile", { new_display_name: "Neuer Name" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects disabled accounts before any mutation", async () => {
    const { rpc, maybeSingle } = setup();
    maybeSingle.mockResolvedValue({ data: { status: "disabled" }, error: null });
    await expect(changeDisplayName({ displayName: "Name" })).rejects.toMatchObject({
      code: "INACTIVE_PROFILE",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("requires a verified signed-in user", async () => {
    const { auth } = setup();
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(changeDisplayName({ displayName: "Name" })).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("blocks Google-only credential edits even if editable metadata says email", async () => {
    const { auth } = setup(["google"]);
    await expect(
      changeAccountEmail({ email: "new@example.test", currentPassword: "Password123!" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      changeAccountPassword({
        currentPassword: "Password123!",
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("reauthenticates the current account before requesting email confirmation", async () => {
    const { auth } = setup(["google", "email"]);
    await changeAccountEmail({ email: " NEW@Example.test ", currentPassword: "Password123!" });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "current@example.test",
      password: "Password123!",
    });
    expect(auth.updateUser).toHaveBeenCalledWith(
      { email: "new@example.test" },
      {
        emailRedirectTo:
          "https://a-klassenhoiz.de/auth/callback?next=%2Fprofile%3FemailChange%3Dchecked&source=email-change",
      },
    );
  });

  it("does not request an email change for a wrong password or different identity", async () => {
    const { auth } = setup();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials" },
    });
    await expect(
      changeAccountEmail({ email: "new@example.test", currentPassword: "wrong" }),
    ).rejects.toMatchObject({ field: "currentPassword" });
    expect(auth.updateUser).not.toHaveBeenCalled();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "other-user" } },
      error: null,
    });
    await expect(
      changeAccountEmail({ email: "new@example.test", currentPassword: "wrong" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects the current email and invalid password confirmations before mutation", async () => {
    const { auth } = setup();
    await expect(
      changeAccountEmail({ email: "CURRENT@example.test", currentPassword: "Password123!" }),
    ).rejects.toMatchObject({ field: "email" });
    await expect(
      changeAccountPassword({
        currentPassword: "Password123!",
        password: "NewPassword123!",
        passwordConfirmation: "Different123!",
      }),
    ).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("checks the current password atomically and invalidates sessions after success", async () => {
    const { auth } = setup(["email", "google"]);
    await changeAccountPassword({
      currentPassword: "Password123!",
      password: "NewPassword123!",
      passwordConfirmation: "NewPassword123!",
    });
    expect(auth.updateUser).toHaveBeenCalledWith({
      current_password: "Password123!",
      password: "NewPassword123!",
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "current@example.test",
      password: "Password123!",
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("rejects a wrong current password before sending any password update", async () => {
    const { auth } = setup();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials" },
    });
    await expect(
      changeAccountPassword({
        currentPassword: "Wrong123!",
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      }),
    ).rejects.toMatchObject({ field: "currentPassword" });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("does not sign out after a rejected password update", async () => {
    const { auth } = setup();
    auth.updateUser.mockResolvedValue({ error: { code: "same_password" } });
    await expect(
      changeAccountPassword({
        currentPassword: "Password123!",
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      }),
    ).rejects.toMatchObject({ field: "password" });
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("returns a useful rate-limit error without exposing raw Auth errors", async () => {
    const { auth } = setup();
    auth.updateUser.mockResolvedValue({ error: { status: 429, message: "private" } });
    await expect(
      changeAccountPassword({
        currentPassword: "Password123!",
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!",
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
