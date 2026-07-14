import { AuthInvalidJwtError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getMyProfile } from "@/features/profile/service";

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
