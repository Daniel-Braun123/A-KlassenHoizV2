const BFV_EXTERNAL_CONSTRAINTS = [
  "league_seasons_external_competition_unique",
  "matchdays_external_id_unique",
  "matches_external_id_unique",
] as const;

export function bfvImportConstraintMessage(
  error: Readonly<{ code?: string; message?: string }> | null,
): string | null {
  if (
    error?.code !== "23505" ||
    !BFV_EXTERNAL_CONSTRAINTS.some((constraint) => error.message?.includes(constraint))
  ) {
    return null;
  }

  return "Dieser BFV-Spielplan ist bereits mit einer anderen Liga verknüpft. Trenne dort zuerst die BFV-Verknüpfung.";
}
