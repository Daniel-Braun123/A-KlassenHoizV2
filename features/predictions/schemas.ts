import { z } from "zod";

const goals = z.number().int().min(0).max(99);

export const savePredictionSchema = z.object({
  roundId: z.uuid(),
  matchId: z.uuid(),
  homeGoals: goals,
  awayGoals: goals,
  idempotencyKey: z.uuid(),
});

export const predictionSheetQuerySchema = z.object({ roundId: z.uuid() });
