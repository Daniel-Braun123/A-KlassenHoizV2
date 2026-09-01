import { readFile, writeFile } from "node:fs/promises";

const marker = "__BUILD_VERSION__";
const configuredDeploymentVersion =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_URL;

if (process.env.VERCEL !== "1") {
  console.log("Service worker stamping skipped outside Vercel.");
  process.exit(0);
}

const deploymentVersion = configuredDeploymentVersion ?? `build-${Date.now()}`;

const serviceWorkerPath = new URL("../public/sw.js", import.meta.url);
const source = await readFile(serviceWorkerPath, "utf8");
if (!source.includes(marker)) {
  throw new Error("Service worker build marker is missing.");
}

const safeVersion = deploymentVersion.replaceAll(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
await writeFile(serviceWorkerPath, source.replaceAll(marker, safeVersion), "utf8");
console.log(`Service worker stamped for deployment ${safeVersion}.`);
