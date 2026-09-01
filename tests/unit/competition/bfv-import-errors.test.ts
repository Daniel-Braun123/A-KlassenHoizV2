import { describe, expect, it } from "vitest";

import { bfvImportConstraintMessage } from "@/features/competition/bfv-import-errors";

describe("BFV import errors", () => {
  it("explains when the BFV schedule is already linked to another league", () => {
    expect(
      bfvImportConstraintMessage({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "league_seasons_external_competition_unique"',
      }),
    ).toBe(
      "Dieser BFV-Spielplan ist bereits mit einer anderen Liga verknüpft. Trenne dort zuerst die BFV-Verknüpfung.",
    );
  });

  it("does not relabel unrelated database conflicts", () => {
    expect(
      bfvImportConstraintMessage({
        code: "23505",
        message: 'duplicate key value violates unique constraint "unrelated_unique"',
      }),
    ).toBeNull();
  });
});
