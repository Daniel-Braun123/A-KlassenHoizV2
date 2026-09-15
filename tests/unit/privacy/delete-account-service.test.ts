import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteUser: vi.fn(),
  verified: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
vi.mock("@/features/privacy/delete-account", () => ({
  deleteAuthUserIdempotently: mocks.deleteUser,
}));
vi.mock("@/features/privacy/reauthentication", () => ({
  hasGoogleDeletionVerification: mocks.verified,
  clearDeletionVerification: mocks.clear,
}));
import { deleteCurrentAccount } from "@/features/privacy/service";

function setup(providers = ["google"]) {
  const user = {
    id: "own-user",
    email: "own@example.test",
    identities: providers.map((provider) => ({ provider })),
  };
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const rpc = vi.fn().mockResolvedValue({ data: user.id, error: null });
  mocks.create.mockResolvedValue({ auth, schema: () => ({ rpc }) });
  return { auth, rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verified.mockResolvedValue(true);
});
describe("account deletion", () => {
  it("does not require an app password for a Google account after Google confirmation", async () => {
    const { auth } = setup();
    await deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN" });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledWith("own-user");
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(auth.signOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteUser.mock.invocationCallOrder[0]!,
    );
  });
  it("rejects missing Google verification even when form data claims it is verified", async () => {
    const { rpc } = setup();
    mocks.verified.mockResolvedValue(false);
    await expect(
      deleteCurrentAccount({
        confirmation: "KONTO LÖSCHEN",
        verified: true,
        google: false,
        password: "anything",
      }),
    ).rejects.toThrow("Google");
    expect(rpc).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("still requires a password for email accounts", async () => {
    const { rpc, auth } = setup(["email"]);
    await expect(deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN" })).rejects.toThrow(
      "App-Passwort",
    );
    expect(rpc).not.toHaveBeenCalled();
    await deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN", password: "Password42!" });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "own@example.test",
      password: "Password42!",
    });
    expect(mocks.verified).not.toHaveBeenCalled();
  });
  it("reports a wrong password without deleting anything", async () => {
    const { auth, rpc } = setup(["email"]);
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials" },
    });
    await expect(
      deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN", password: "wrong" }),
    ).rejects.toThrow("Passwort stimmt nicht");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects a different identity returned by password verification", async () => {
    const { auth, rpc } = setup(["email"]);
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "other" } }, error: null });
    await expect(
      deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN", password: "Password42!" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses Google verification for linked accounts too", async () => {
    const { auth } = setup(["google", "email"]);
    await deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN" });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.verified).toHaveBeenCalled();
  });
  it("keeps the ownership restriction and explains how to proceed", async () => {
    const { rpc, auth } = setup();
    rpc.mockResolvedValue({ data: null, error: { code: "P0001" } });
    await expect(deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN" })).rejects.toThrow(
      "Tipprunden",
    );
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation even after Google verification", async () => {
    const { rpc } = setup();
    await expect(deleteCurrentAccount({ confirmation: "ja" })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not delete an unexpected account returned by the database", async () => {
    const { rpc } = setup();
    rpc.mockResolvedValue({ data: "other", error: null });
    await expect(deleteCurrentAccount({ confirmation: "KONTO LÖSCHEN" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
