export type BfvSourceResult = Readonly<{
  awayGoals: number;
  homeGoals: number;
}>;

export type BfvSourceMatch = Readonly<{
  awayClubName: string;
  date: string;
  homeClubName: string;
  kickoffAt: string;
  result: BfvSourceResult | null;
  sourceMarkedChanged: boolean;
  sourceMatchNumber: string;
  sourceMatchdayNumber: number;
  time: string;
}>;

export type BfvSourceMatchday = Readonly<{
  endsOn: string;
  matches: BfvSourceMatch[];
  phase: "first_leg" | "second_leg";
  phaseNumber: number;
  sourceNumber: number;
  startsOn: string;
}>;

export type BfvScheduleDocument = Readonly<{
  documentDate: string | null;
  leagueName: string;
  leagueNumber: string;
  matchdays: BfvSourceMatchday[];
  pageCount: number;
  seasonLabel: string;
  sourceClubNames: string[];
  sourceMarkedChangedCount: number;
  sourceResultCount: number;
  warnings: string[];
}>;

export type BfvClubMapping = Record<string, string>;

export type BfvImportMatchAction = "blocked" | "create" | "unchanged" | "unmapped" | "update";

export type BfvImportPlannedMatch = BfvSourceMatch &
  Readonly<{
    action: BfvImportMatchAction;
    awayClubId: string | null;
    changes: string[];
    existingMatchId: string | null;
    expectedVersion: number | null;
    homeClubId: string | null;
  }>;

export type BfvImportPlan = Readonly<{
  blockedCount: number;
  canImport: boolean;
  createCount: number;
  matches: BfvImportPlannedMatch[];
  unchangedCount: number;
  unmatchedExistingCount: number;
  unmappedCount: number;
  updateCount: number;
}>;

export type BfvImportResult = Readonly<{
  createdMatches: number;
  createdMatchdays: number;
  unchangedMatches: number;
  updatedMatches: number;
  updatedMatchdays: number;
}>;

export type BfvPreviewActionState =
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{
      status: "success";
      document: BfvScheduleDocument;
      initialMappings: BfvClubMapping;
      seasonMatches: boolean;
    }>;

export type BfvImportActionState =
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "success"; message: string; result: BfvImportResult }>;
