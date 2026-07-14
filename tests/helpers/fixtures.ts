import { createLocalActorClient } from "./local-actors";
export async function createPublishedCompetition() {
  const admin = createLocalActorClient("app-admin@example.test");
  const suffix = crypto.randomUUID().slice(0, 8);
  const league = await admin
    .schema("api")
    .rpc("create_league", { p_name: `Fixture Liga ${suffix}` });
  const season = await admin.schema("api").rpc("create_season", {
    p_label: `F-${suffix}`,
    p_starts_on: "2026-07-01",
    p_ends_on: "2027-06-30",
  });
  const competition = await admin
    .schema("api")
    .rpc("create_league_season", { p_league_id: league.data!, p_season_id: season.data! });
  await admin.schema("api").rpc("transition_league_season", {
    p_id: competition.data!,
    p_expected_version: 1,
    p_status: "published",
  });
  return { id: competition.data!, label: `Fixture Liga ${suffix} · F-${suffix}` };
}
export async function createRoundInvitationFixture() {
  const competition = await createPublishedCompetition();
  const owner = createLocalActorClient("owner@example.test");
  const suffix = crypto.randomUUID().slice(0, 8);
  const round = await owner.schema("api").rpc("create_round", {
    p_name: `Freunde ${suffix}`,
    p_league_season_id: competition.id,
    p_nickname: "Besitzer",
    p_idempotency_key: crypto.randomUUID(),
  });
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(raw).toString("base64url");
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
  await owner.schema("api").rpc("rotate_round_invitation", {
    p_round_id: round.data!,
    p_token_hash: `\\x${Buffer.from(hash).toString("hex")}`,
  });
  return { roundId: round.data!, roundName: `Freunde ${suffix}`, token };
}

export async function createPredictionFixture(matchCount = 8) {
  const admin = createLocalActorClient("app-admin@example.test");
  const suffix = crypto.randomUUID().slice(0, 8);
  const league = await admin.schema("api").rpc("create_league", { p_name: `Tipp Liga ${suffix}` });
  const season = await admin.schema("api").rpc("create_season", {
    p_label: `T-${suffix}`,
    p_starts_on: "2026-07-01",
    p_ends_on: "2027-06-30",
  });
  const competition = await admin
    .schema("api")
    .rpc("create_league_season", { p_league_id: league.data!, p_season_id: season.data! });
  const clubs: Array<{ id: string; name: string }> = [];
  for (let index = 0; index < matchCount * 2; index += 1) {
    const name = `Verein ${suffix}-${index + 1}`;
    const club = await admin
      .schema("api")
      .rpc("create_club", { p_name: name, p_short_name: `${suffix.slice(0, 6)}-${index + 1}` });
    if (club.error) throw club.error;
    const assignment = await admin
      .schema("api")
      .rpc("assign_club", { p_league_season_id: competition.data!, p_club_id: club.data! });
    if (assignment.error) throw assignment.error;
    clubs.push({ id: club.data!, name });
  }
  const matchday = await admin.schema("api").rpc("create_matchday", {
    p_league_season_id: competition.data!,
    p_number: 1,
    p_display_name: "1. Spieltag",
  });
  const matches: Array<{
    id: string;
    homeName: string;
    awayName: string;
    kickoffAt: string;
    version: number;
  }> = [];
  for (let index = 0; index < matchCount; index += 1) {
    const home = clubs[index * 2]!;
    const away = clubs[index * 2 + 1]!;
    const kickoffAt = new Date(Date.now() + 86_400_000 + index * 3_600_000).toISOString();
    const match = await admin.schema("api").rpc("create_match", {
      p_matchday_id: matchday.data!,
      p_home_club_id: home.id,
      p_away_club_id: away.id,
      p_kickoff_at: kickoffAt,
    });
    if (match.error) throw match.error;
    const publication = await admin.schema("api").rpc("update_match", {
      p_id: match.data!,
      p_expected_version: 1,
      p_matchday_id: matchday.data!,
      p_home_club_id: home.id,
      p_away_club_id: away.id,
      p_kickoff_at: kickoffAt,
      p_status: "published",
    });
    if (publication.error) throw publication.error;
    matches.push({
      id: match.data!,
      homeName: home.name,
      awayName: away.name,
      kickoffAt,
      version: 2,
    });
  }
  const dayPublication = await admin.schema("api").rpc("update_matchday", {
    p_id: matchday.data!,
    p_expected_version: 1,
    p_number: 1,
    p_display_name: "1. Spieltag",
    p_status: "published",
  });
  if (dayPublication.error) throw dayPublication.error;
  const competitionPublication = await admin.schema("api").rpc("transition_league_season", {
    p_id: competition.data!,
    p_expected_version: 1,
    p_status: "published",
  });
  if (competitionPublication.error) throw competitionPublication.error;
  const owner = createLocalActorClient("owner@example.test");
  const round = await owner.schema("api").rpc("create_round", {
    p_name: `Tipprunde ${suffix}`,
    p_league_season_id: competition.data!,
    p_nickname: "Daniel",
    p_idempotency_key: crypto.randomUUID(),
  });
  if (round.error) throw round.error;
  return {
    roundId: round.data!,
    roundName: `Tipprunde ${suffix}`,
    matchdayId: matchday.data!,
    matches,
    competitionId: competition.data!,
  };
}

export async function updateFixtureMatch(
  match: { id: string; homeName: string; awayName: string; kickoffAt: string; version: number },
  matchdayId: string,
  status: "published" | "postponed" | "cancelled" | "abandoned" | "completed",
  kickoffAt = match.kickoffAt,
) {
  const admin = createLocalActorClient("app-admin@example.test");
  const schedule = await admin
    .schema("api")
    .from("schedule")
    .select("home_club_id,away_club_id,match_version")
    .eq("match_id", match.id)
    .single();
  if (schedule.error) throw schedule.error;
  const result = await admin.schema("api").rpc("update_match", {
    p_id: match.id,
    p_expected_version: schedule.data.match_version!,
    p_matchday_id: matchdayId,
    p_home_club_id: schedule.data.home_club_id!,
    p_away_club_id: schedule.data.away_club_id!,
    p_kickoff_at: kickoffAt,
    p_status: status,
  });
  if (result.error) throw result.error;
}
