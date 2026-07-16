"use server";

import { ZodError } from "zod";

import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/actions/result";

import { revalidatePrediction } from "./cache";
import { savePrediction, savePredictionsBatch } from "./service";
import type {
  SavePredictionConfirmation,
  SavePredictionInput,
  SavePredictionsBatchConfirmation,
  SavePredictionsBatchInput,
} from "./types";

export async function savePredictionAction(
  input: SavePredictionInput,
): Promise<ActionResult<SavePredictionConfirmation>> {
  try {
    const confirmation = await savePrediction(input);
    revalidatePrediction(input.roundId);
    return actionSuccess(confirmation);
  } catch (error) {
    return actionFailure(
      error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
    );
  }
}

export async function savePredictionsBatchAction(
  input: SavePredictionsBatchInput,
): Promise<ActionResult<SavePredictionsBatchConfirmation>> {
  try {
    const confirmation = await savePredictionsBatch(input);
    revalidatePrediction(input.roundId);
    return actionSuccess(confirmation);
  } catch (error) {
    return actionFailure(
      error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
    );
  }
}
