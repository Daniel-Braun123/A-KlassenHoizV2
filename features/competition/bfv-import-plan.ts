import type {
  BfvClubMapping,
  BfvImportPlan,
  BfvImportPlannedMatch,
  BfvScheduleDocument,
} from "./bfv-import-types";

export type BfvImportClub = Readonly<{ id: string; name: string }>;

export type BfvExistingScheduleRow = Readonly<{
  away_club_id: string | null;
  decision: string | null;
  external_match_id?: string | null;
  external_source?: string | null;
  home_club_id: string | null;
  kickoff_at: string | null;
  match_has_predictions: boolean | null;
  match_id: string | null;
  match_status: string | null;
  match_version: number | null;
  matchday_number: number;
  phase: "first_leg" | "second_leg";
}>;

function normalizedClubName(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("de-DE");
}

function looseClubName(value: string): string {
  return normalizedClubName(value)
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function suggestBfvClubMappings(
  sourceClubNames: string[],
  clubs: BfvImportClub[],
): BfvClubMapping {
  const exact = new Map<string, string>();
  const loose = new Map<string, string[]>();
  for (const club of clubs) {
    exact.set(normalizedClubName(club.name), club.id);
    const key = looseClubName(club.name);
    loose.set(key, [...(loose.get(key) ?? []), club.id]);
  }

  return Object.fromEntries<string>(
    sourceClubNames.map((name) => {
      const exactId = exact.get(normalizedClubName(name));
      if (exactId) return [name, exactId] as const;
      const looseIds = loose.get(looseClubName(name)) ?? [];
      return [name, looseIds.length === 1 ? (looseIds[0] ?? "") : ""] as const;
    }),
  );
}

export function bfvSourceMatchId(
  leagueNumber: string,
  seasonLabel: string,
  sourceMatchNumber: string,
): string {
  return `${leagueNumber}:${seasonLabel}:${sourceMatchNumber}`;
}

export function bfvSourceMatchdayId(
  leagueNumber: string,
  seasonLabel: string,
  sourceMatchdayNumber: number,
): string {
  return `${leagueNumber}:${seasonLabel}:ST${sourceMatchdayNumber}`;
}

function sameInstant(left: string | null, right: string): boolean {
  if (!left) return false;
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  return Number.isFinite(leftTime) && Number.isFinite(rightTime)
    ? leftTime === rightTime
    : left === right;
}

function dayKey(phase: "first_leg" | "second_leg", number: number): string {
  return `${phase}:${number}`;
}

export function buildBfvImportPlan(
  document: BfvScheduleDocument,
  schedule: BfvExistingScheduleRow[],
  mappings: BfvClubMapping,
): BfvImportPlan {
  const rowsByExternalId = new Map<string, BfvExistingScheduleRow>();
  const rowsByDay = new Map<string, BfvExistingScheduleRow[]>();
  for (const row of schedule) {
    if (row.external_source === "bfv" && row.external_match_id) {
      rowsByExternalId.set(row.external_match_id, row);
    }
    if (!row.match_id) continue;
    const key = dayKey(row.phase, row.matchday_number);
    rowsByDay.set(key, [...(rowsByDay.get(key) ?? []), row]);
  }

  const matchedExistingIds = new Set<string>();
  const matches: BfvImportPlannedMatch[] = [];

  for (const matchday of document.matchdays) {
    const candidates = rowsByDay.get(dayKey(matchday.phase, matchday.phaseNumber)) ?? [];
    for (const match of matchday.matches) {
      const homeClubId = mappings[match.homeClubName] || null;
      const awayClubId = mappings[match.awayClubName] || null;
      if (!homeClubId || !awayClubId || homeClubId === awayClubId) {
        matches.push({
          ...match,
          action: "unmapped",
          awayClubId,
          changes: [],
          existingMatchId: null,
          expectedVersion: null,
          homeClubId,
        });
        continue;
      }

      const sourceId = bfvSourceMatchId(
        document.leagueNumber,
        document.seasonLabel,
        match.sourceMatchNumber,
      );
      const externalCandidate = rowsByExternalId.get(sourceId);
      const availableCandidates = candidates.filter(
        (candidate) => candidate.match_id && !matchedExistingIds.has(candidate.match_id),
      );
      const exactCandidate = availableCandidates.find(
        (candidate) =>
          candidate.home_club_id === homeClubId && candidate.away_club_id === awayClubId,
      );
      const pairedCandidate = availableCandidates.find(
        (candidate) =>
          new Set([candidate.home_club_id, candidate.away_club_id]).size === 2 &&
          [candidate.home_club_id, candidate.away_club_id].includes(homeClubId) &&
          [candidate.home_club_id, candidate.away_club_id].includes(awayClubId),
      );
      const existing = externalCandidate ?? exactCandidate ?? pairedCandidate;

      if (!existing?.match_id) {
        matches.push({
          ...match,
          action: "create",
          awayClubId,
          changes: [],
          existingMatchId: null,
          expectedVersion: null,
          homeClubId,
        });
        continue;
      }

      matchedExistingIds.add(existing.match_id);
      const changes: string[] = [];
      if (existing.home_club_id !== homeClubId || existing.away_club_id !== awayClubId) {
        const onlyHomeRightChanged =
          existing.home_club_id === awayClubId && existing.away_club_id === homeClubId;
        changes.push(onlyHomeRightChanged ? "Heimrecht" : "Paarung");
      }
      if (!sameInstant(existing.kickoff_at, match.kickoffAt)) changes.push("Anpfiff");
      const blocked = Boolean(
        changes.length &&
        (existing.match_has_predictions ||
          existing.decision ||
          existing.match_status === "completed"),
      );
      matches.push({
        ...match,
        action: blocked ? "blocked" : changes.length ? "update" : "unchanged",
        awayClubId,
        changes,
        existingMatchId: existing.match_id,
        expectedVersion: existing.match_version,
        homeClubId,
      });
    }
  }

  const counts = matches.reduce(
    (result, match) => ({ ...result, [match.action]: result[match.action] + 1 }),
    { blocked: 0, create: 0, unchanged: 0, unmapped: 0, update: 0 },
  );
  const existingMatchIds = new Set(schedule.flatMap((row) => (row.match_id ? [row.match_id] : [])));

  return {
    blockedCount: counts.blocked,
    canImport: counts.blocked === 0 && counts.unmapped === 0 && matches.length > 0,
    createCount: counts.create,
    matches,
    unchangedCount: counts.unchanged,
    unmatchedExistingCount: [...existingMatchIds].filter((id) => !matchedExistingIds.has(id))
      .length,
    unmappedCount: counts.unmapped,
    updateCount: counts.update,
  };
}
