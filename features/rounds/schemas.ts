import { z } from "zod";
export const createRoundSchema = z.object({
  name: z.string().trim().min(1).max(80),
  leagueSeasonId: z.string().uuid(),
  nickname: z.string().trim().min(1).max(40),
  idempotencyKey: z.string().uuid(),
});
export const updateRoundSchema = z.object({
  roundId: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(80),
  leagueSeasonId: z.string().uuid(),
});
export const roundIdSchema = z.string().uuid();
