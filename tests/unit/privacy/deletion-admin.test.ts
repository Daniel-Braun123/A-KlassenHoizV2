import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), signOut: vi.fn(), deleteUser: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.create }));
vi.mock("@/lib/config/env", () => ({
  readServerEnvironment: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:56321",
    SUPABASE_SECRET_KEY: "local-test-only-admin-key",
  }),
}));
import {
  deleteAuthUserIdempotently,
  revokeAuthUserSessions,
} from "@/features/privacy/delete-account";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.create.mockReturnValue({
    auth: { admin: { signOut: mocks.signOut, deleteUser: mocks.deleteUser } },
  });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
});

it("revokes all refresh sessions using the caller's access token without persisting an admin session", async () => {
  await revokeAuthUserSessions("verified-access-token");
  expect(mocks.signOut).toHaveBeenCalledWith("verified-access-token", "global");
  expect(mocks.create).toHaveBeenCalledWith("http://127.0.0.1:56321", "local-test-only-admin-key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

it("fails closed if global session revocation is unavailable", async () => {
  mocks.signOut.mockResolvedValue({ error: { status: 503 } });
  await expect(revokeAuthUserSessions("verified-access-token")).rejects.toMatchObject({
    code: "UNAVAILABLE",
  });
  expect(mocks.deleteUser).not.toHaveBeenCalled();
});

it("permits an idempotent retry after the Auth account is already gone", async () => {
  mocks.deleteUser.mockResolvedValue({ error: { status: 404, code: "user_not_found" } });
  await expect(deleteAuthUserIdempotently("own-user")).resolves.toBeUndefined();
});

it("reports a failed Auth deletion so the browser can retry", async () => {
  mocks.deleteUser.mockResolvedValue({ error: { status: 503 } });
  await expect(deleteAuthUserIdempotently("own-user")).rejects.toMatchObject({
    code: "UNAVAILABLE",
  });
});
