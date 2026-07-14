import { z } from "zod";
export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const rotateInvitationSchema = z.object({ roundId: z.string().uuid() });
export const joinRoundSchema = z.object({
  token: invitationTokenSchema,
  nickname: z.string().trim().min(1).max(40),
  idempotencyKey: z.string().uuid(),
});
