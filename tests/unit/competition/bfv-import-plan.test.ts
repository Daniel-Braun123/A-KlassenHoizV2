import { describe, expect, it } from "vitest";

import {
  buildBfvImportPlan,
  bfvSourceMatchId,
  suggestBfvClubMappings,
  type BfvExistingScheduleRow,
} from "@/features/competition/bfv-import-plan";
import type { BfvScheduleDocument } from "@/features/competition/bfv-import-types";

const document: BfvScheduleDocument = {
  documentDate: "2026-08-31",
  leagueName: "A-Klasse Vilshofen",
  leagueNumber: "312541",
  matchdays: [
    {
      endsOn: "2026-07-24",
      matches: [
        {
          awayClubName: "SV Beutelsbach",
          date: "2026-07-24",
          homeClubName: "SV Hofkirchen 2",
          kickoffAt: "2026-07-24T17:00:00.000Z",
          result: null,
          sourceMarkedChanged: false,
          sourceMatchNumber: "312540001",
          sourceMatchdayNumber: 1,
          time: "19:00",
        },
      ],
      phase: "first_leg",
      phaseNumber: 1,
      sourceNumber: 1,
      startsOn: "2026-07-24",
    },
  ],
  pageCount: 1,
  seasonLabel: "26/27",
  sourceClubNames: ["SV Beutelsbach", "SV Hofkirchen 2"],
  sourceMarkedChangedCount: 0,
  sourceResultCount: 0,
  warnings: [],
};

const mappings = { "SV Beutelsbach": "away", "SV Hofkirchen 2": "home" };

function existing(overrides: Partial<BfvExistingScheduleRow> = {}): BfvExistingScheduleRow {
  return {
    away_club_id: "away",
    decision: null,
    external_match_id: bfvSourceMatchId("312541", "26/27", "312540001"),
    external_source: "bfv",
    home_club_id: "home",
    kickoff_at: "2026-07-24T17:00:00.000Z",
    match_has_predictions: false,
    match_id: "match-1",
    match_status: "scheduled",
    match_version: 3,
    matchday_number: 1,
    phase: "first_leg",
    ...overrides,
  };
}

describe("BFV import planning", () => {
  it("suggests unambiguous exact and normalized club mappings", () => {
    expect(
      suggestBfvClubMappings(
        ["SV Hofkirchen 2", "DJK-SV Dörfbach"],
        [
          { id: "home", name: "SV Hofkirchen 2" },
          { id: "dorf", name: "DJK SV Dorfbach" },
        ],
      ),
    ).toEqual({ "DJK-SV Dörfbach": "dorf", "SV Hofkirchen 2": "home" });
  });

  it("plans a new match without touching unmatched existing games", () => {
    const plan = buildBfvImportPlan(document, [], mappings);

    expect(plan).toMatchObject({
      blockedCount: 0,
      canImport: true,
      createCount: 1,
      unchangedCount: 0,
      unmappedCount: 0,
      updateCount: 0,
    });
    expect(plan.matches[0]).toMatchObject({ action: "create", existingMatchId: null });
  });

  it("is idempotent for an already imported unchanged match", () => {
    const plan = buildBfvImportPlan(document, [existing()], mappings);

    expect(plan.unchangedCount).toBe(1);
    expect(plan.matches[0]).toMatchObject({
      action: "unchanged",
      existingMatchId: "match-1",
      expectedVersion: 3,
    });
  });

  it("allows harmless schedule updates until predictions or results exist", () => {
    const changedKickoff = existing({ kickoff_at: "2026-07-24T16:00:00.000Z" });
    const editable = buildBfvImportPlan(document, [changedKickoff], mappings);
    const protectedMatch = buildBfvImportPlan(
      document,
      [existing({ kickoff_at: "2026-07-24T16:00:00.000Z", match_has_predictions: true })],
      mappings,
    );

    expect(editable.matches[0]).toMatchObject({ action: "update", changes: ["Anpfiff"] });
    expect(protectedMatch.matches[0]).toMatchObject({ action: "blocked" });
    expect(protectedMatch.canImport).toBe(false);
  });

  it("requires every source club to be mapped exactly once per pairing", () => {
    const plan = buildBfvImportPlan(document, [], {
      "SV Beutelsbach": "home",
      "SV Hofkirchen 2": "home",
    });

    expect(plan.matches[0]?.action).toBe("unmapped");
    expect(plan.canImport).toBe(false);
  });
});
