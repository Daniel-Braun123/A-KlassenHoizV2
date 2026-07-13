import { fixtureActors, fixtureClock, fixtureCompetition, fixtureRounds } from "@/tests/fixtures";

export type FixtureSession = Readonly<{
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  userId: string;
}>;

export type FixtureDbActor = Readonly<{
  appRole: "user" | "app_admin";
  profileStatus: "active" | "deletion_pending" | "disabled";
  userId: string;
}>;

export type FixtureRound = Readonly<{
  id: string;
  leagueSeasonId: string;
  name: string;
  ownerMembershipId: string;
  status: "active" | "archived";
  version: number;
}>;

export type FixtureMatch = Readonly<{
  awayClubId: string;
  homeClubId: string;
  id: string;
  kickoffAt: string;
  matchdayId: string;
  status: "draft" | "published" | "postponed" | "cancelled" | "completed" | "abandoned";
  version: number;
}>;

export function makeSession(overrides: Partial<FixtureSession> = {}): FixtureSession {
  return {
    accessToken: "synthetic-access-token",
    expiresAt: 1_786_000_000,
    refreshToken: "synthetic-refresh-token",
    userId: fixtureActors.member,
    ...overrides,
  };
}

export function makeDbActor(overrides: Partial<FixtureDbActor> = {}): FixtureDbActor {
  return {
    appRole: "user",
    profileStatus: "active",
    userId: fixtureActors.member,
    ...overrides,
  };
}

export function makeRound(overrides: Partial<FixtureRound> = {}): FixtureRound {
  return {
    id: fixtureRounds.primaryRoundId,
    leagueSeasonId: fixtureCompetition.leagueSeasonId,
    name: "Freunde 2026",
    ownerMembershipId: fixtureRounds.ownerMembershipId,
    status: "active",
    version: 1,
    ...overrides,
  };
}

export function makeMatch(overrides: Partial<FixtureMatch> = {}): FixtureMatch {
  return {
    awayClubId: fixtureCompetition.awayClubId,
    homeClubId: fixtureCompetition.homeClubId,
    id: fixtureCompetition.matchId,
    kickoffAt: fixtureClock.atKickoff,
    matchdayId: fixtureCompetition.matchdayId,
    status: "published",
    version: 1,
    ...overrides,
  };
}

export function fixedDatabaseClockSql(instant: string = fixtureClock.now): string {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.valueOf())) {
    throw new TypeError("Fixture DB time must be an ISO timestamp.");
  }

  return `set local app.test_now = '${parsed.toISOString()}'`;
}
