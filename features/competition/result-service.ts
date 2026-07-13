import "server-only";

import { resultSchema } from "./schemas";
import { requireAppAdmin, throwCompetitionError } from "./server";

export async function setMatchResult(
  input: unknown,
): Promise<{ revisionNo: number; matchVersion: number; recalculatedCount: number }> {
  const value = resultSchema.parse(input);
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
    revisionNo: row.revision_no,
    matchVersion: row.match_version,
    recalculatedCount: row.recalculated_count,
  };
}
