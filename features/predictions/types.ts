import type { Database } from "@/lib/supabase/database.types";

export type PredictionSheetRow = Database["api"]["Views"]["matchday_prediction_sheet"]["Row"];
export type RoundOverview = Database["api"]["Views"]["round_overview"]["Row"];
export type VisiblePrediction = Database["api"]["Views"]["visible_predictions"]["Row"];

export type SavePredictionInput = Readonly<{
  roundId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  idempotencyKey: string;
}>;

export type SavePredictionConfirmation = Readonly<{
  predictionId: string;
  savedAt: string;
}>;
