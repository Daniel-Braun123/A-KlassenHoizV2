import "server-only";

import { ApplicationError } from "@/lib/actions/errors";

export type ProfileStatus = "active" | "deletion_pending" | "disabled";
export type AppRole = "user" | "app_admin";
export type RoundRole = "owner" | "member";

export type AuthorizationContext = Readonly<{
  userId: string;
  profileStatus: ProfileStatus;
  appRole: AppRole;
}>;

export type ClaimsReader = Readonly<{
  getSubject(): Promise<string | null>;
}>;

export type RoundMembershipReader = Readonly<{
  getActiveRole(userId: string, roundId: string): Promise<RoundRole | null>;
}>;

export async function requireAuthenticatedUser(claims: ClaimsReader): Promise<string> {
  const subject = await claims.getSubject();

  if (!subject) {
    throw new ApplicationError("UNAUTHENTICATED");
  }

  return subject;
}

export function requireActiveProfile(context: AuthorizationContext): void {
  if (context.profileStatus !== "active") {
    throw new ApplicationError("INACTIVE_PROFILE");
  }
}

export function requireAppAdmin(context: AuthorizationContext): void {
  requireActiveProfile(context);

  if (context.appRole !== "app_admin") {
    throw new ApplicationError("FORBIDDEN");
  }
}

export async function requireRoundMembership(
  context: AuthorizationContext,
  roundId: string,
  memberships: RoundMembershipReader,
): Promise<RoundRole> {
  requireActiveProfile(context);
  const role = await memberships.getActiveRole(context.userId, roundId);

  if (!role) {
    throw new ApplicationError("NOT_FOUND");
  }

  return role;
}

export async function requireRoundOwner(
  context: AuthorizationContext,
  roundId: string,
  memberships: RoundMembershipReader,
): Promise<void> {
  const role = await requireRoundMembership(context, roundId, memberships);

  if (role !== "owner") {
    throw new ApplicationError("FORBIDDEN");
  }
}
