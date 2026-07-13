import { describe, expect, it } from "vitest";

import { ApplicationError } from "@/lib/actions/errors";
import {
  requireActiveProfile,
  requireAppAdmin,
  requireAuthenticatedUser,
  requireRoundMembership,
  requireRoundOwner,
  type AuthorizationContext,
} from "@/lib/auth/guards";

const activeUser: AuthorizationContext = {
  userId: "00000000-0000-4000-8000-000000000001",
  profileStatus: "active",
  appRole: "user",
};

describe("authorization guards", () => {
  it("requires a verified subject", async () => {
    await expect(requireAuthenticatedUser({ getSubject: async () => null })).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("rejects inactive profiles before role checks", () => {
    expect(() => requireActiveProfile({ ...activeUser, profileStatus: "disabled" })).toThrowError(
      ApplicationError,
    );
  });

  it("does not confuse owner and global app-admin capabilities", () => {
    expect(() => requireAppAdmin(activeUser)).toThrowError(ApplicationError);
    expect(() => requireAppAdmin({ ...activeUser, appRole: "app_admin" })).not.toThrow();
  });

  it("returns only the active role supplied by the object membership reader", async () => {
    const memberships = { getActiveRole: async () => "member" as const };
    await expect(requireRoundMembership(activeUser, "round-a", memberships)).resolves.toBe(
      "member",
    );
    await expect(requireRoundOwner(activeUser, "round-a", memberships)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("uses not-found semantics for inaccessible rounds", async () => {
    await expect(
      requireRoundMembership(activeUser, "foreign-round", { getActiveRole: async () => null }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
