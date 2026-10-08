import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  const adminLogin = await admin.auth.signInWithPassword({
    email: "app-admin@example.test",
    password: "LocalFixture42!",
  });
  if (adminLogin.error) throw adminLogin.error;
  async function rpc(client, name, parameters) {
    const { data, error } = await client.schema("api").rpc(name, parameters);
    if (error) throw new Error(`Lighthouse fixture ${name}: ${error.message}`, { cause: error });
    if (data === null) throw new Error(`Lighthouse fixture ${name} returned no result`);
    return data;
  }
  const suffix = crypto.randomUUID().slice(0, 8);
  const clubs = [];
  for (let index = 0; index < 16; index += 1) {
    const club = await rpc(admin, "create_club_simple", {
      p_name: `Lab Verein ${suffix}-${index}`,
    });
    clubs.push(club);
  }
  const competition = await rpc(admin, "create_admin_league", {
    p_name: `Lab Liga ${suffix}`,
    p_year_label: "26/27",
    p_club_ids: clubs,
  });
  const firstKickoff = new Date(Date.now() + 86_400_000);
  const lastKickoff = new Date(firstKickoff.getTime() + 7 * 3_600_000);
  const berlinDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const matchday = await rpc(admin, "create_matchday_auto", {
    p_league_id: competition,
    p_phase: "first_leg",
    p_starts_on: berlinDate.format(firstKickoff),
    p_ends_on: berlinDate.format(lastKickoff),
  });
  for (let index = 0; index < 8; index += 1) {
    const kickoff = new Date(firstKickoff.getTime() + index * 3_600_000).toISOString();
    await rpc(admin, "create_match_simple", {
      p_matchday_id: matchday,
      p_home_club_id: clubs[index * 2],
      p_away_club_id: clubs[index * 2 + 1],
      p_kickoff_at: kickoff,
    });
  }
  await rpc(admin, "publish_admin_league", {
    p_id: competition,
    p_expected_version: 1,
  });
  const owner = make("owner");
  const ownerLogin = await owner.auth.signInWithPassword({
    email: "owner@example.test",
    password: "LocalFixture42!",
  });
  if (ownerLogin.error) throw ownerLogin.error;
  const round = await rpc(owner, "create_round", {
    p_name: `Lab Runde ${suffix}`,
    p_league_season_id: competition,
    p_nickname: "Lab Owner",
    p_idempotency_key: crypto.randomUUID(),
  });
  return { roundId: round };
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

async function withTimeout(promise, timeoutMs, label) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs} ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

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
  const runTimeoutMs = Number(process.env.LH_TIMEOUT_MS ?? 90_000);
  const evidence = {
    generatedAt: new Date().toISOString(),
    lighthouse: JSON.parse(
      await readFile(join(root, "node_modules", "lighthouse", "package.json"), "utf8"),
    ).version,
    chromium: chromium.executablePath(),
    lab: lighthouseLab,
    routes: [],
  };
  for (const route of routes) {
    const runs = [];
    for (let index = 0; index < runCount; index += 1) {
      let completedRun;
      let lastError;
      for (let attempt = 1; attempt <= 2 && !completedRun; attempt += 1) {
        const profile = join(
          root,
          ".lighthouse-profiles",
          `${route.name}-${index}-${attempt}-${crypto.randomUUID()}`,
        );
        await mkdir(profile, { recursive: true });
        const chrome = await chromeLauncher.launch({
          chromePath: chromium.executablePath(),
          userDataDir: profile,
          chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
        });
        try {
          const result = await withTimeout(
            lighthouse(
              `http://127.0.0.1:3000${route.path}`,
              { port: chrome.port, output: "json", logLevel: "error" },
              createLighthouseConfig(route.cookie ? { Cookie: route.cookie } : {}),
            ),
            runTimeoutMs,
            `${route.name} run ${index + 1} attempt ${attempt}`,
          );
          if (result.lhr.runtimeError || result.lhr.audits["http-status-code"]?.score === 0) {
            throw new Error(`Lighthouse could not load ${route.name}`);
          }
          const audits = result.lhr.audits;
          completedRun = {
            performance: result.lhr.categories.performance.score,
            fcpMs: audits["first-contentful-paint"].numericValue,
            lcpMs: audits["largest-contentful-paint"].numericValue,
            cls: audits["cumulative-layout-shift"].numericValue,
            tbtMs: audits["total-blocking-time"].numericValue,
            serverResponseMs: audits["server-response-time"]?.numericValue,
            lcpBreakdown: audits["lcp-breakdown-insight"]?.details,
          };
        } catch (error) {
          lastError = error;
        } finally {
          try {
            await chrome.kill();
          } catch (error) {
            if (error?.code !== "EPERM") throw error;
          }
        }
      }
      if (!completedRun) throw lastError;
      runs.push(completedRun);
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
    console.log(JSON.stringify(evidence.routes.at(-1)));
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
