import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { predictionSheetQuerySchema, savePredictionSchema } from "./schemas";
import type {
  PredictionSheetRow,
  RoundOverview,
  SavePredictionConfirmation,
  VisiblePrediction,
} from "./types";

function mapDatabaseError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "P0001") throw new ApplicationError("DEADLINE_PASSED", error.message);
  if (error.code === "P0002") throw new ApplicationError("NOT_FOUND", error.message);
  if (error.code === "22023" || error.code === "23514") {
    throw new ApplicationError("INVALID_INPUT", error.message);
  }
  throw new ApplicationError("UNAVAILABLE", "Prediction operation failed", { cause: error });
}

export async function getRoundOverview(roundId: string): Promise<RoundOverview | null> {
  const value = predictionSheetQuerySchema.parse({ roundId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("round_overview")
    .select("*")
    .eq("round_id", value.roundId)
    .maybeSingle();
  mapDatabaseError(error);
  return data;
}

export async function listPredictionSheet(roundId: string): Promise<PredictionSheetRow[]> {
  const value = predictionSheetQuerySchema.parse({ roundId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("matchday_prediction_sheet")
    .select("*")
    .eq("round_id", value.roundId)
    .order("matchday_number")
    .order("kickoff_at");
  mapDatabaseError(error);
  return data ?? [];
}

export async function listVisiblePredictions(roundId: string): Promise<VisiblePrediction[]> {
  const value = predictionSheetQuerySchema.parse({ roundId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("visible_predictions")
    .select("*")
    .eq("round_id", value.roundId)
    .order("nickname");
  mapDatabaseError(error);
  return data ?? [];
}

export async function savePrediction(input: unknown): Promise<SavePredictionConfirmation> {
  const value = savePredictionSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("save_prediction", {
    p_round_id: value.roundId,
    p_match_id: value.matchId,
    p_home_goals: value.homeGoals,
    p_away_goals: value.awayGoals,
    p_idempotency_key: value.idempotencyKey,
  });
  mapDatabaseError(error);
  const confirmation = data?.[0];
  if (!confirmation) throw new ApplicationError("UNAVAILABLE", "Missing save confirmation");
  return { predictionId: confirmation.prediction_id, savedAt: confirmation.saved_at };
}
