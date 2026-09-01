"use server";

import { revalidatePath } from "next/cache";

import { ApplicationError, publicMessageFor, toApplicationError } from "@/lib/actions/errors";
import type { BfvImportActionState, BfvPreviewActionState } from "./bfv-import-types";
import { executeBfvScheduleImport, previewBfvSchedule } from "./bfv-import-service";

function fileFrom(data: FormData): File {
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) {
    throw new ApplicationError("INVALID_INPUT", "Bitte wähle die BFV-Spielplan-PDF aus.");
  }
  return file;
}

function actionError(error: unknown): Readonly<{ status: "error"; message: string }> {
  const applicationError = toApplicationError(error);
  return {
    status: "error",
    message:
      applicationError.code === "INVALID_INPUT"
        ? applicationError.message
        : publicMessageFor(applicationError.code),
  };
}

export async function previewBfvScheduleAction(data: FormData): Promise<BfvPreviewActionState> {
  try {
    return await previewBfvSchedule(String(data.get("leagueId") ?? ""), fileFrom(data));
  } catch (error) {
    return actionError(error);
  }
}

export async function importBfvScheduleAction(data: FormData): Promise<BfvImportActionState> {
  try {
    const leagueId = String(data.get("leagueId") ?? "");
    const result = await executeBfvScheduleImport(
      leagueId,
      fileFrom(data),
      String(data.get("mappings") ?? ""),
    );
    revalidatePath(`/admin/competitions/${leagueId}/schedule`);
    revalidatePath(`/admin/competitions/${leagueId}/results`);
    return {
      status: "success",
      message: `${result.createdMatchdays} Spieltage und ${result.createdMatches} Spiele wurden neu angelegt. ${result.updatedMatches} Spiele wurden aktualisiert.`,
      result,
    };
  } catch (error) {
    return actionError(error);
  }
}
