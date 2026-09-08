import { AuthInvalidJwtError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getMyProfile, getMyAccountDetails } from "@/features/profile/service";

describe("getMyAccountDetails", () => {
  it("returns only the signed-in user's displayable account details", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "test@example.test",
              created_at: "2026-07-13T12:00:00Z",
              email_confirmed_at: "2026-07-13T12:01:00Z",
              identities: [{ provider: "google" }, { provider: "email" }, { provider: "google" }],
              user_metadata: { private: "hidden" },
            },
          },
          error: null,
        }),
      },
    });
    await expect(getMyAccountDetails()).resolves.toEqual({
      email: "test@example.test",
      pendingEmail: null,
      createdAt: "2026-07-13T12:00:00Z",
      emailConfirmed: true,
      providers: ["google", "email"],
    });
  });
  it("does not show account details for an invalid session", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: new AuthInvalidJwtError("expired") }),
      },
    });
    await expect(getMyAccountDetails()).resolves.toBeNull();
  });
});

describe("getMyProfile", () => {
  beforeEach(() => {
    mocks.createSupabaseServerClient.mockReset();
  });

  it("treats an invalid stale session as anonymous", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: null,
          error: new AuthInvalidJwtError("stale token"),
        }),
      },
    });

    await expect(getMyProfile()).resolves.toBeNull();
  });

  it("keeps a verified session identifiable when its profile row is missing", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "verified-user" } },
          error: null,
        }),
      },
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    });

    await expect(getMyProfile()).resolves.toEqual({
      app_role: null,
      display_name: null,
      status: null,
      user_id: "verified-user",
    });
  });
});
