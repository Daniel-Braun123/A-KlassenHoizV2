import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import { createPredictionFixture, createPublishedCompetition } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
import { finishMatchForLocalTest } from "../../helpers/local-database";

const exec = promisify(execFile);
const ownerId = "00000000-0000-4000-8000-000000000003";
const memberId = "00000000-0000-4000-8000-000000000002";
function queryFailure(error: unknown): string {
  // execFile's message includes the SQL command (and statement_timeout).
  // Check PostgreSQL's diagnostic rather than mistaking that option for a timeout.
  if (error && typeof error === "object" && "stderr" in error) return String(error.stderr);
  return String(error);
}
async function query(sql: string) {
  // The CLI uses prepared statements and rejects BEGIN/SET/query/COMMIT batches.
  // psql opens an independent connection for each competing transaction. Pin the
  // Docker endpoint to the local engine, irrespective of the user's context.
  const dockerHost =
    process.platform === "win32"
      ? "npipe:////./pipe/dockerDesktopLinuxEngine"
      : "unix:///var/run/docker.sock";
  return exec(
    "docker",
    [
      "--host",
      dockerHost,
      "exec",
      "supabase_db_A-KlassenHoizv2",
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--command",
      sql,
    ],
    { timeout: 25_000 },
  );
}
function transaction(actor: string, name: string, sql: string) {
  return `begin; set local statement_timeout = '15s';
    set local application_name = '${name}';
    select set_config('request.jwt.claim.sub', '${actor}', true);
    select set_config('request.jwt.claims', '{"sub":"${actor}","role":"authenticated"}', true);
    ${sql} commit;`;
}
function waitForBlocked(name: string) {
  return `do $wait$ begin
    for attempt in 1..500 loop
      perform pg_stat_clear_snapshot();
      if exists (select 1 from pg_stat_activity where application_name = '${name}' and wait_event_type = 'Lock') then return; end if;
      perform pg_sleep(0.02);
    end loop;
    raise exception 'Concurrent request never reached its lock';
  end $wait$;`;
}
function waitForStarted(name: string) {
  return `do $wait$ begin
    for attempt in 1..500 loop
      perform pg_stat_clear_snapshot();
      if exists (select 1 from pg_stat_activity where application_name = '${name}' and wait_event = 'PgSleep') then return; end if;
      perform pg_sleep(0.02);
    end loop;
    raise exception 'First request never reached its barrier';
  end $wait$;`;
}
async function fixture() {
  const round = await createPredictionFixture(1);
  const target = await createPublishedCompetition("27/28");
  const admin = createLocalActorClient("app-admin@example.test");
  const owner = createLocalActorClient("owner@example.test");
  const token = `\\x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;
  expect(
    (
      await owner
        .schema("api")
        .rpc("rotate_round_invitation", { p_round_id: round.roundId, p_token_hash: token })
    ).error,
  ).toBeNull();
  finishMatchForLocalTest(round.matches[0]!.id);
  expect(
    (
      await admin.schema("api").rpc("set_match_result", {
        p_match_id: round.matches[0]!.id,
        p_expected_match_version: round.matches[0]!.version,
        p_expected_revision: 0,
        p_decision: "official",
        p_home_goals: 1,
        p_away_goals: 0,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.schema("api").rpc("transition_league_season", {
        p_id: round.competitionId,
        p_expected_version: 2,
        p_status: "completed",
      })
    ).error,
  ).toBeNull();
  return { ...round, targetId: target.id, token, owner };
}

it.each(["join", "rotate"] as const)(
  "finishes rollover while a concurrent %s waits, then rejects the old invitation",
  async (operation) => {
    const f = await fixture();
    const suffix = crypto.randomUUID();
    const firstName = `rollover-${suffix}`;
    const secondName = `invitation-${suffix}`;
    const rollover = query(
      transaction(
        ownerId,
        firstName,
        `
    select id from app.prediction_rounds where id = '${f.roundId}' for update;
    ${waitForBlocked(secondName)}
    select api.rollover_round('${f.roundId}', '${f.targetId}', 1);
  `,
      ),
    );
    const invitation = (async () => {
      await query(waitForStarted(firstName));
      return query(
        transaction(
          operation === "join" ? memberId : ownerId,
          secondName,
          operation === "join"
            ? `select api.join_round('${f.token}', 'Parallel', '${crypto.randomUUID()}');`
            : `select * from api.rotate_round_invitation('${f.roundId}', '${f.token}');`,
        ),
      );
    })();
    const results = await Promise.allSettled([rollover, invitation]);
    expect(
      results[0].status,
      results[0].status === "rejected" ? String(results[0].reason) : "",
    ).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
    if (results[1].status === "rejected") {
      expect(queryFailure(results[1].reason)).toMatch(
        /Invitation unavailable|Invitations are unavailable after a season rollover/,
      );
      expect(queryFailure(results[1].reason)).not.toMatch(/deadlock|timeout/i);
    }
    const old = await f.owner
      .schema("api")
      .from("my_rounds")
      .select("successor_round_id")
      .eq("id", f.roundId)
      .single();
    expect(old.data?.successor_round_id).toBeTruthy();
    const members = await f.owner
      .schema("api")
      .from("round_members")
      .select("nickname")
      .eq("round_id", old.data!.successor_round_id!);
    expect(members.data?.map((member) => member.nickname)).toEqual(["Daniel"]);
  },
  40_000,
);

it("copies a member whose join acquired the round lock before rollover", async () => {
  const f = await fixture();
  const suffix = crypto.randomUUID();
  const firstName = `join-${suffix}`;
  const secondName = `rollover-${suffix}`;
  const join = query(
    transaction(
      memberId,
      firstName,
      `
    select api.join_round('${f.token}', 'Parallel', '${crypto.randomUUID()}');
    ${waitForBlocked(secondName)}
  `,
    ),
  );
  const rollover = (async () => {
    await query(waitForStarted(firstName));
    return query(
      transaction(
        ownerId,
        secondName,
        `select api.rollover_round('${f.roundId}', '${f.targetId}', 1);`,
      ),
    );
  })();
  const results = await Promise.allSettled([join, rollover]);
  expect(
    results.map((result) => result.status),
    results
      .filter((result) => result.status === "rejected")
      .map((result) => String(result.reason))
      .join("\n"),
  ).toEqual(["fulfilled", "fulfilled"]);
  const old = await f.owner
    .schema("api")
    .from("my_rounds")
    .select("successor_round_id")
    .eq("id", f.roundId)
    .single();
  const member = createLocalActorClient("member@example.test");
  const copied = await member
    .schema("api")
    .from("my_rounds")
    .select("nickname")
    .eq("id", old.data!.successor_round_id!)
    .single();
  expect(copied.error).toBeNull();
  expect(copied.data?.nickname).toBe("Parallel");
}, 40_000);
