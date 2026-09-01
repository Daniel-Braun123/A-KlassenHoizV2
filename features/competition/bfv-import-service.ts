import "server-only";

import { z } from "zod";

import { ApplicationError } from "@/lib/actions/errors";
import type { Json } from "@/lib/supabase/database.types";
import {
  buildBfvImportPlan,
  bfvSourceMatchdayId,
  bfvSourceMatchId,
  suggestBfvClubMappings,
} from "./bfv-import-plan";
import { bfvImportConstraintMessage } from "./bfv-import-errors";
import type { BfvClubMapping, BfvImportResult, BfvPreviewActionState } from "./bfv-import-types";
import { parseBfvSchedulePdf } from "./bfv-pdf";
import { requireAppAdmin, throwCompetitionError } from "./server";

const uuid = z.string().uuid();

async function loadImportContext(leagueId: string) {
  const parsedLeagueId = uuid.parse(leagueId);
  const supabase = await requireAppAdmin();
  const [leagueResponse, scheduleResponse, clubsResponse] = await Promise.all([
    supabase.schema("api").from("admin_leagues").select("*").eq("id", parsedLeagueId).maybeSingle(),
    supabase
      .schema("api")
      .from("admin_schedule")
      .select("*")
      .eq("league_id", parsedLeagueId)
      .order("matchday_number")
      .order("kickoff_at"),
    supabase.schema("api").from("club_catalog").select("id,name").order("name"),
  ]);
  throwCompetitionError(leagueResponse.error);
  throwCompetitionError(scheduleResponse.error);
  throwCompetitionError(clubsResponse.error);
  const league = leagueResponse.data;
  if (!league?.id || !league.year_label) throw new ApplicationError("NOT_FOUND");
  const leagueClubIds = new Set(league.club_ids ?? []);
  const clubs = (clubsResponse.data ?? []).flatMap((club) =>
    club.id && club.name && leagueClubIds.has(club.id) ? [{ id: club.id, name: club.name }] : [],
  );
  const schedule = (scheduleResponse.data ?? []).flatMap((row) =>
    row.matchday_number !== null && row.phase
      ? [
          {
            away_club_id: row.away_club_id,
            decision: row.decision,
            external_match_id: row.external_match_id,
            external_source: row.external_source,
            home_club_id: row.home_club_id,
            kickoff_at: row.kickoff_at,
            match_has_predictions: row.match_has_predictions,
            match_id: row.match_id,
            match_status: row.match_status,
            match_version: row.match_version,
            matchday_number: row.matchday_number,
            phase: row.phase,
          },
        ]
      : [],
  );

  return { clubs, league, schedule, supabase };
}

function parseMappings(rawMappings: string, sourceClubNames: string[]): BfvClubMapping {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawMappings);
  } catch (error) {
    throw new ApplicationError("INVALID_INPUT", "Die Vereinszuordnung ist ungültig.", {
      cause: error,
    });
  }
  const mappings = z.record(z.string(), z.string().uuid()).parse(parsed);
  if (sourceClubNames.some((name) => !mappings[name])) {
    throw new ApplicationError(
      "INVALID_INPUT",
      "Bitte ordne jeden BFV-Verein einem Verein der Liga zu.",
    );
  }
  return mappings;
}

export async function previewBfvSchedule(
  leagueId: string,
  file: File,
): Promise<Extract<BfvPreviewActionState, { status: "success" }>> {
  const [document, context] = await Promise.all([
    parseBfvSchedulePdf(file),
    loadImportContext(leagueId),
  ]);
  return {
    status: "success",
    document,
    initialMappings: suggestBfvClubMappings(document.sourceClubNames, context.clubs),
    seasonMatches: document.seasonLabel === context.league.year_label,
  };
}

export async function executeBfvScheduleImport(
  leagueId: string,
  file: File,
  rawMappings: string,
): Promise<BfvImportResult> {
  const [document, context] = await Promise.all([
    parseBfvSchedulePdf(file),
    loadImportContext(leagueId),
  ]);
  if (document.seasonLabel !== context.league.year_label) {
    throw new ApplicationError(
      "INVALID_INPUT",
      `Die PDF gehört zur Saison ${document.seasonLabel}, ausgewählt ist ${context.league.year_label}.`,
    );
  }
  if (!document.documentDate) {
    throw new ApplicationError(
      "INVALID_INPUT",
      "Das Ausgabedatum der BFV-Terminliste konnte nicht erkannt werden.",
    );
  }
  const mappings = parseMappings(rawMappings, document.sourceClubNames);
  const plan = buildBfvImportPlan(document, context.schedule, mappings);
  if (plan.unmappedCount) {
    throw new ApplicationError(
      "INVALID_INPUT",
      "Bitte ordne jeden BFV-Verein einem Verein der Liga zu.",
    );
  }
  if (plan.blockedCount) {
    throw new ApplicationError(
      "INVALID_INPUT",
      "Mindestens eine BFV-Änderung ist durch vorhandene Tipps oder Ergebnisse gesperrt.",
    );
  }

  const matchdays: Json = document.matchdays.map((matchday) => ({
    endsOn: matchday.endsOn,
    externalId: bfvSourceMatchdayId(
      document.leagueNumber,
      document.seasonLabel,
      matchday.sourceNumber,
    ),
    phase: matchday.phase,
    phaseNumber: matchday.phaseNumber,
    sourceNumber: matchday.sourceNumber,
    startsOn: matchday.startsOn,
  }));
  const matches: Json = plan.matches.map((match) => ({
    awayClubId: match.awayClubId!,
    existingMatchId: match.existingMatchId,
    expectedVersion: match.expectedVersion,
    externalId: bfvSourceMatchId(
      document.leagueNumber,
      document.seasonLabel,
      match.sourceMatchNumber,
    ),
    externalMatchdayId: bfvSourceMatchdayId(
      document.leagueNumber,
      document.seasonLabel,
      match.sourceMatchdayNumber,
    ),
    homeClubId: match.homeClubId!,
    kickoffAt: match.kickoffAt,
    sourceMarkedChanged: match.sourceMarkedChanged,
  }));
  const { data, error } = await context.supabase.schema("api").rpc("import_bfv_schedule", {
    p_document_date: document.documentDate,
    p_league_id: leagueId,
    p_league_number: document.leagueNumber,
    p_matches: matches,
    p_matchdays: matchdays,
    p_season_label: document.seasonLabel,
  });
  const constraintMessage = bfvImportConstraintMessage(error);
  if (constraintMessage) throw new ApplicationError("INVALID_INPUT", constraintMessage);
  throwCompetitionError(error);
  const result = data?.[0];
  if (!result) throw new ApplicationError("UNAVAILABLE", "BFV import returned no result");
  return {
    createdMatches: result.created_matches,
    createdMatchdays: result.created_matchdays,
    unchangedMatches: result.unchanged_matches,
    updatedMatches: result.updated_matches,
    updatedMatchdays: result.updated_matchdays,
  };
}
