export type InvitationPreview = Readonly<{
  roundName: string;
  leagueName: string;
  seasonLabel: string;
  expiresAt: string;
}>;
export type InvitationActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
  invitationUrl?: string;
  expiresAt?: string;
}>;
export const initialInvitationActionState: InvitationActionState = { status: "idle" };
