import { z } from "zod";

export const updateNicknameSchema = z.object({
  roundId: z.uuid(),
  nickname: z.string().trim().min(1).max(40),
});
export const transferOwnershipSchema = z.object({
  roundId: z.uuid(),
  targetMembershipId: z.uuid(),
  expectedVersion: z.coerce.number().int().positive(),
});
export const membershipMutationSchema = z.object({ roundId: z.uuid(), membershipId: z.uuid() });
export const roundLifecycleSchema = z.object({
  roundId: z.uuid(),
  expectedVersion: z.coerce.number().int().positive(),
});
export const hardDeleteRoundSchema = z
  .object({
    roundId: z.uuid(),
    expectedVersion: z.coerce.number().int().positive(),
    roundName: z.string().min(1).max(80),
    confirmationName: z.string(),
  })
  .refine((value) => value.roundName === value.confirmationName, {
    path: ["confirmationName"],
    message: "Der Name muss exakt übereinstimmen.",
  });
export const deleteAccountSchema = z.object({
  confirmation: z.literal("KONTO LÖSCHEN"),
  password: z.string().min(8).max(200),
});
