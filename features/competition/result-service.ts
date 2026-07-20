import "server-only";

import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";
import { listAdminSchedule, type AdminScheduleRow } from "./schedule-service";
import { requireAppAdmin, throwCompetitionError } from "./server";

const resultInputSchema = z
  .object({
    matchId: z.string().uuid(),
    expectedMatchVersion: z.coerce.number().int().positive(),
    expectedRevision: z.coerce.number().int().min(0),
    decision: z.enum(["official", "excluded"]),
    homeGoals: z.coerce.number().int().min(0).max(99).optional(),
    awayGoals: z.coerce.number().int().min(0).max(99).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.decision === "official" &&
      (value.homeGoals === undefined || value.awayGoals === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Für ein offizielles Ergebnis werden beide Torwerte benötigt.",
      });
    }
  });

const resultBatchSchema = z.array(resultInputSchema).min(1).max(100);

export type MatchResultInput = z.infer<typeof resultInputSchema>;
export type MatchResultMutation = Readonly<{
  matchId: string;
  revisionNo: number;
  matchVersion: number;
  recalculatedCount: number;
}>;

export async function listAdminResults(leagueId: string): Promise<AdminScheduleRow[]> {
  return listAdminSchedule(leagueId);
}

export async function setMatchResult(input: unknown): Promise<MatchResultMutation> {
  const value = resultInputSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("set_match_result", {
    p_match_id: value.matchId,
    p_expected_match_version: value.expectedMatchVersion,
    p_expected_revision: value.expectedRevision,
    p_decision: value.decision,
    ...(value.decision === "official"
      ? { p_home_goals: value.homeGoals!, p_away_goals: value.awayGoals! }
      : {}),
    ...(value.reason ? { p_reason: value.reason } : {}),
  });
  throwCompetitionError(error);
  const row = data?.[0];
  if (!row) throw new Error("Result RPC returned no row");
  return {
    matchId: value.matchId,
    revisionNo: row.revision_no,
    matchVersion: row.match_version,
    recalculatedCount: row.recalculated_count,
  };
}

export async function setMatchResultsBatch(input: unknown): Promise<MatchResultMutation[]> {
  const values = resultBatchSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("set_match_results_batch", {
    p_results: values.map((value) => ({
      matchId: value.matchId,
      expectedMatchVersion: value.expectedMatchVersion,
      expectedRevision: value.expectedRevision,
      decision: value.decision,
      homeGoals: value.decision === "official" ? value.homeGoals! : null,
      awayGoals: value.decision === "official" ? value.awayGoals! : null,
      reason: value.reason ?? null,
    })) as Json,
  });
  throwCompetitionError(error);
  return (data ?? []).map((row) => ({
    matchId: row.match_id,
    revisionNo: row.revision_no,
    matchVersion: row.match_version,
    recalculatedCount: row.recalculated_count,
  }));
}
