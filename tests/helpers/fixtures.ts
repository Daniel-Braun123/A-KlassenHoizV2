import { createLocalActorClient } from "./local-actors";

export async function createPublishedCompetition() {
  const admin = createLocalActorClient("app-admin@example.test");
  const suffix = crypto.randomUUID().slice(0, 8);
  const clubs = await Promise.all(
    ["Heim", "Auswärts"].map((role) =>
      admin.schema("api").rpc("create_club_simple", { p_name: `${role} ${suffix}` }),
    ),
  );
  for (const club of clubs) if (club.error) throw club.error;

  const competition = await admin.schema("api").rpc("create_admin_league", {
    p_name: `Fixture Liga ${suffix}`,
    p_year_label: "26/27",
    p_club_ids: clubs.map((club) => club.data!),
  });
  if (competition.error) throw competition.error;
  const publication = await admin.schema("api").rpc("publish_admin_league", {
    p_id: competition.data!,
    p_expected_version: 1,
  });
  if (publication.error) throw publication.error;
  return { id: competition.data!, label: `Fixture Liga ${suffix} · 26/27` };
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
  if (round.error) throw round.error;
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(raw).toString("base64url");
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
  const invitation = await owner.schema("api").rpc("rotate_round_invitation", {
    p_round_id: round.data!,
    p_token_hash: `\\x${Buffer.from(hash).toString("hex")}`,
  });
  if (invitation.error) throw invitation.error;
  return { roundId: round.data!, roundName: `Freunde ${suffix}`, token };
}

export async function createPredictionFixture(matchCount = 8, firstKickoffOffsetMs = 86_400_000) {
  const admin = createLocalActorClient("app-admin@example.test");
  const suffix = crypto.randomUUID().slice(0, 8);
  const clubs: Array<{ id: string; name: string }> = [];
  for (let index = 0; index < matchCount * 2; index += 1) {
    const name = `Verein ${suffix}-${index + 1}`;
    const club = await admin.schema("api").rpc("create_club_simple", { p_name: name });
    if (club.error) throw club.error;
    clubs.push({ id: club.data!, name });
  }

  const competition = await admin.schema("api").rpc("create_admin_league", {
    p_name: `Tipp Liga ${suffix}`,
    p_year_label: "26/27",
    p_club_ids: clubs.map((club) => club.id),
  });
  if (competition.error) throw competition.error;
  const matchday = await admin.schema("api").rpc("create_matchday_auto", {
    p_league_id: competition.data!,
    p_phase: "first_leg",
  });
  if (matchday.error) throw matchday.error;

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
    const kickoffAt = new Date(Date.now() + firstKickoffOffsetMs + index * 3_600_000).toISOString();
    const match = await admin.schema("api").rpc("create_match_simple", {
      p_matchday_id: matchday.data!,
      p_home_club_id: home.id,
      p_away_club_id: away.id,
      p_kickoff_at: kickoffAt,
    });
    if (match.error) throw match.error;
    matches.push({
      id: match.data!,
      homeName: home.name,
      awayName: away.name,
      kickoffAt,
      version: 2,
    });
  }

  const competitionPublication = await admin.schema("api").rpc("publish_admin_league", {
    p_id: competition.data!,
    p_expected_version: 1,
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
