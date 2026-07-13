import { z } from "zod";
export const supportGrantSchema = z.object({
  roundId: z.uuid(),
  caseReference: z.string().trim().min(3).max(80),
  reason: z.string().trim().min(10).max(500),
  durationMinutes: z.coerce.number().int().min(1).max(15),
});
export const supportGrantIdSchema = z.uuid();
