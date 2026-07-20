import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/**
 * Moves a synthetic local fixture past the product's 90-minute result lock.
 * This talks directly to the local test database and is never part of application code.
 */
export function finishMatchForLocalTest(matchId: string): void {
  if (!uuidPattern.test(matchId)) throw new Error("A valid local fixture match id is required.");
  const cli = resolve(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
  const sql = `
    with updated_period as (
      update app.matchdays md
      set starts_on = least(md.starts_on, (clock_timestamp() at time zone 'Europe/Berlin')::date),
          ends_on = greatest(md.ends_on, (clock_timestamp() at time zone 'Europe/Berlin')::date)
      where exists (
        select 1 from app.matches m where m.id = '${matchId}'::uuid and m.matchday_id = md.id
      )
      returning md.id
    )
    update app.matches
    set kickoff_at = clock_timestamp() - interval '2 hours'
    where id = '${matchId}'::uuid
      and matchday_id in (select id from updated_period);
  `;

  execFileSync(process.execPath, [cli, "db", "query", "--local", sql], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
}
