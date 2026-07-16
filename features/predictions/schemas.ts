import { z } from "zod";

const goals = z.number().int().min(0).max(99);

export const savePredictionSchema = z.object({
  roundId: z.uuid(),
  matchId: z.uuid(),
  homeGoals: goals,
  awayGoals: goals,
  idempotencyKey: z.uuid(),
});

export const savePredictionsBatchSchema = z.object({
  roundId: z.uuid(),
  predictions: z
    .array(savePredictionSchema.omit({ roundId: true }))
    .min(1)
    .max(100)
    .refine(
      (predictions) =>
        new Set(predictions.map((prediction) => prediction.matchId)).size === predictions.length,
      { message: "Jedes Spiel darf nur einmal gespeichert werden." },
    ),
});

export const predictionSheetQuerySchema = z.object({ roundId: z.uuid() });
