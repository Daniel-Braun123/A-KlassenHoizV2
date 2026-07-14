"use server";
import { ZodError } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure } from "@/lib/actions/result";
import {
  createAndReadSupportMetadata,
  revokeSupportMetadata,
  type SupportMetadata,
} from "./service";
export type SupportState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
  grantId?: string;
  metadata?: SupportMetadata;
}>;
const failure = (error: unknown): SupportState => {
  const result = actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", error.message) : error,
  );
  return { status: "error", ...result.error };
};
export async function accessSupportMetadataAction(
  _: SupportState,
  data: FormData,
): Promise<SupportState> {
  try {
    const result = await createAndReadSupportMetadata({
      roundId: data.get("roundId"),
      caseReference: data.get("caseReference"),
      reason: data.get("reason"),
      durationMinutes: data.get("durationMinutes"),
    });
    return { status: "success", message: "Zeitlich begrenzte Metadatenansicht aktiv.", ...result };
  } catch (e) {
    return failure(e);
  }
}
export async function revokeSupportAccessAction(
  _: SupportState,
  data: FormData,
): Promise<SupportState> {
  try {
    await revokeSupportMetadata(String(data.get("grantId")));
    return { status: "success", message: "Supportzugriff wurde widerrufen." };
  } catch (e) {
    return failure(e);
  }
}
