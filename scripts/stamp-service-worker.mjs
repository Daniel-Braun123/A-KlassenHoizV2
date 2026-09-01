import { readFile, writeFile } from "node:fs/promises";

const marker = "__BUILD_VERSION__";
const deploymentVersion =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_URL;

if (!deploymentVersion) {
  if (process.env.VERCEL === "1") {
    throw new Error("Vercel deployment version is unavailable.");
  }
  console.log("Service worker stamping skipped outside Vercel.");
  process.exit(0);
}

const serviceWorkerPath = new URL("../public/sw.js", import.meta.url);
const source = await readFile(serviceWorkerPath, "utf8");
if (!source.includes(marker)) {
  throw new Error("Service worker build marker is missing.");
}

const safeVersion = deploymentVersion.replaceAll(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
await writeFile(serviceWorkerPath, source.replaceAll(marker, safeVersion), "utf8");
console.log(`Service worker stamped for deployment ${safeVersion}.`);
