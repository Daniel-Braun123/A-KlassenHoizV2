import { ZodError } from "zod";

import { actionFailure } from "@/lib/actions/result";
import { ApplicationError } from "@/lib/actions/errors";
import type { CompetitionActionState } from "./types";

export function competitionFailure(error: unknown): CompetitionActionState {
  const result = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
  );
  return { status: "error", code: result.error.code, message: result.error.message };
}
export const competitionSuccess = (message: string): CompetitionActionState => ({
  status: "success",
  message,
});
