"use server";

import { ZodError } from "zod";

import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/actions/result";

import { revalidatePrediction } from "./cache";
import { savePrediction } from "./service";
import type { SavePredictionConfirmation, SavePredictionInput } from "./types";

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
