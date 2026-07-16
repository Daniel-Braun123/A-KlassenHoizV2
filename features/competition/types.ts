import type { Database } from "@/lib/supabase/database.types";

export type AdminLeagueRow = Database["api"]["Views"]["admin_leagues"]["Row"];
export type CompetitionCatalogRow = Database["api"]["Views"]["competition_catalog"]["Row"];
export type LeagueCatalogRow = Database["api"]["Views"]["league_catalog"]["Row"];
export type SeasonCatalogRow = Database["api"]["Views"]["season_catalog"]["Row"];
export type ClubCatalogRow = Database["api"]["Views"]["club_catalog"]["Row"];
export type ScheduleRow = Database["api"]["Views"]["schedule"]["Row"];
export type AdminScheduleRow = Database["api"]["Views"]["admin_schedule"]["Row"];
export type PublishedLeagueSeason = Database["api"]["Views"]["published_league_seasons"]["Row"];

export type CompetitionActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
}>;

export const initialCompetitionActionState: CompetitionActionState = { status: "idle" };
