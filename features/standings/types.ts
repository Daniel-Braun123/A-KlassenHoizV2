export type LeagueTableClub = Readonly<{
  id: string;
  name: string;
  logoUrl: string | null;
}>;

export type LeagueTableResult = Readonly<{
  away_club_name: string | null;
  away_goals: number | null;
  decision: "official" | "excluded" | null;
  home_club_name: string | null;
  home_goals: number | null;
}>;

export type LeagueTableRow = Readonly<{
  clubId: string;
  clubName: string;
  logoUrl: string | null;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
}>;
