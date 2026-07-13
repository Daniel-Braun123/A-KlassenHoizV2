import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createLighthouseConfig, lighthouseLab } from "../lighthouse.config.mjs";

const root = process.cwd();
const supabase =
  process.platform === "win32"
    ? join(root, "node_modules", ".bin", "supabase.cmd")
    : join(root, "node_modules", ".bin", "supabase");
const commandEnvironment = { ...process.env };
if (commandEnvironment.DOCKER_CERT_PATH && !commandEnvironment.DOCKER_CERT_PATH.includes(root)) {
  delete commandEnvironment.DOCKER_CERT_PATH;
  delete commandEnvironment.DOCKER_HOST;
  delete commandEnvironment.DOCKER_TLS_VERIFY;
}
const status = spawnSync(supabase, ["status", "-o", "env"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
  env: commandEnvironment,
});
if (status.status !== 0) throw new Error("Local Supabase must be running for the Lighthouse lab.");
for (const line of status.stdout.split(/\r?\n/)) {
  const match = line.match(/^(API_URL|PUBLISHABLE_KEY)="([^"]+)"$/);
  if (match) process.env[match[1]] = match[2];
}
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.API_URL;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY;
process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000";

const make = (name) =>
  createClient(process.env.API_URL, process.env.PUBLISHABLE_KEY, {
    auth: { persistSession: false, storageKey: `lab-${name}-${crypto.randomUUID()}` },
  });
async function createFixture() {
  const admin = make("admin");
  await admin.auth.signInWithPassword({
    email: "app-admin@example.test",
    password: "LocalFixture42!",
  });
  const suffix = crypto.randomUUID().slice(0, 8);
  const league = await admin.schema("api").rpc("create_league", { p_name: `Lab Liga ${suffix}` });
  const season = await admin.schema("api").rpc("create_season", {
    p_label: `Lab-${suffix}`,
    p_starts_on: "2026-07-01",
    p_ends_on: "2027-06-30",
  });
  const competition = await admin
    .schema("api")
    .rpc("create_league_season", { p_league_id: league.data, p_season_id: season.data });
  const clubs = [];
  for (let index = 0; index < 16; index += 1) {
    const club = await admin.schema("api").rpc("create_club", {
      p_name: `Lab Verein ${suffix}-${index}`,
      p_short_name: `L${suffix.slice(0, 4)}-${index}`,
    });
    await admin
      .schema("api")
      .rpc("assign_club", { p_league_season_id: competition.data, p_club_id: club.data });
    clubs.push(club.data);
  }
  const matchday = await admin.schema("api").rpc("create_matchday", {
    p_league_season_id: competition.data,
    p_number: 1,
    p_display_name: "1. Spieltag",
  });
  for (let index = 0; index < 8; index += 1) {
    const kickoff = new Date(Date.now() + 86_400_000 + index * 3_600_000).toISOString();
    const match = await admin.schema("api").rpc("create_match", {
      p_matchday_id: matchday.data,
      p_home_club_id: clubs[index * 2],
      p_away_club_id: clubs[index * 2 + 1],
      p_kickoff_at: kickoff,
    });
    await admin.schema("api").rpc("update_match", {
      p_id: match.data,
      p_expected_version: 1,
      p_matchday_id: matchday.data,
      p_home_club_id: clubs[index * 2],
      p_away_club_id: clubs[index * 2 + 1],
      p_kickoff_at: kickoff,
      p_status: "published",
    });
  }
  await admin.schema("api").rpc("update_matchday", {
    p_id: matchday.data,
    p_expected_version: 1,
    p_number: 1,
    p_display_name: "1. Spieltag",
    p_status: "published",
  });
  await admin.schema("api").rpc("transition_league_season", {
    p_id: competition.data,
    p_expected_version: 1,
    p_status: "published",
  });
  const owner = make("owner");
  await owner.auth.signInWithPassword({ email: "owner@example.test", password: "LocalFixture42!" });
  const round = await owner.schema("api").rpc("create_round", {
    p_name: `Lab Runde ${suffix}`,
    p_league_season_id: competition.data,
    p_nickname: "Lab Owner",
    p_idempotency_key: crypto.randomUUID(),
  });
  return { roundId: round.data };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error(`${command} failed`);
}
async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch("http://127.0.0.1:3000/login")).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Production server did not become ready.");
}
async function loginCookies(email) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3000/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.locator('input[name="password"]').fill("LocalFixture42!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/(start|admin\/competitions)$/);
  const cookies = await page.context().cookies();
  await browser.close();
  return cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const fixture = await createFixture();
run(process.execPath, [join(root, "node_modules", "next", "dist", "bin", "next"), "build"]);
const server = spawn(
  process.execPath,
  [
    join(root, "node_modules", "next", "dist", "bin", "next"),
    "start",
    "-H",
    "127.0.0.1",
    "-p",
    "3000",
  ],
  { cwd: root, env: process.env, stdio: "ignore" },
);
try {
  await waitForServer();
  const ownerCookie = await loginCookies("owner@example.test");
  const adminCookie = await loginCookies("app-admin@example.test");
  const routes = [
    { name: "start-login", path: "/login", cookie: "" },
    { name: "round-overview", path: `/rounds/${fixture.roundId}`, cookie: ownerCookie },
    {
      name: "predictions-eight",
      path: `/rounds/${fixture.roundId}/predictions`,
      cookie: ownerCookie,
    },
    { name: "overall-ranking", path: `/rounds/${fixture.roundId}/rankings`, cookie: ownerCookie },
    { name: "global-results-admin", path: "/admin/results", cookie: adminCookie },
  ].filter((route) => !process.env.LH_ROUTE || route.name === process.env.LH_ROUTE);
  const runCount = Number(process.env.LH_RUNS ?? lighthouseLab.runs);
  const evidence = {
    generatedAt: new Date().toISOString(),
    lighthouse: "13.4.0",
    chromium: chromium.executablePath(),
    lab: lighthouseLab,
    routes: [],
  };
  for (const route of routes) {
    const runs = [];
    for (let index = 0; index < runCount; index += 1) {
      const profile = join(
        root,
        ".lighthouse-profiles",
        `${route.name}-${index}-${crypto.randomUUID()}`,
      );
      await mkdir(profile, { recursive: true });
      const chrome = await chromeLauncher.launch({
        chromePath: chromium.executablePath(),
        userDataDir: profile,
        chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
      });
      try {
        const result = await lighthouse(
          `http://127.0.0.1:3000${route.path}`,
          { port: chrome.port, output: "json", logLevel: "error" },
          createLighthouseConfig(route.cookie ? { Cookie: route.cookie } : {}),
        );
        const audits = result.lhr.audits;
        runs.push({
          performance: result.lhr.categories.performance.score,
          fcpMs: audits["first-contentful-paint"].numericValue,
          lcpMs: audits["largest-contentful-paint"].numericValue,
          cls: audits["cumulative-layout-shift"].numericValue,
          tbtMs: audits["total-blocking-time"].numericValue,
          serverResponseMs: audits["server-response-time"]?.numericValue,
          lcpBreakdown: audits["lcp-breakdown-insight"]?.details,
        });
      } finally {
        try {
          await chrome.kill();
        } catch (error) {
          if (error?.code !== "EPERM") throw error;
        }
      }
    }
    const medians = {
      performance: median(runs.map((x) => x.performance)),
      lcpMs: median(runs.map((x) => x.lcpMs)),
      cls: median(runs.map((x) => x.cls)),
      tbtMs: median(runs.map((x) => x.tbtMs)),
    };
    evidence.routes.push({
      name: route.name,
      path: route.path,
      runs,
      medians,
      passed:
        medians.performance >= lighthouseLab.budgets.performance &&
        medians.lcpMs <= lighthouseLab.budgets.lcpMs &&
        medians.cls <= lighthouseLab.budgets.cls &&
        medians.tbtMs <= lighthouseLab.budgets.tbtMs,
    });
  }
  await mkdir(join(root, "docs", "quality", "artifacts"), { recursive: true });
  const artifactName =
    !process.env.LH_ROUTE && runCount === lighthouseLab.runs
      ? "lighthouse-mobile.json"
      : "lighthouse-mobile-debug.json";
  await writeFile(
    join(root, "docs", "quality", "artifacts", artifactName),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  if (evidence.routes.some((route) => !route.passed))
    throw new Error("One or more Lighthouse median gates failed; inspect the evidence artifact.");
} finally {
  server.kill();
}
