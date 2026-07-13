import { spawnSync } from "node:child_process";

const [script, ...scriptArguments] = process.argv.slice(2);
if (!script) throw new Error("A PowerShell script path is required.");

const windows = process.platform === "win32";
const executable = windows ? "powershell" : "pwsh";
const arguments_ = ["-NoProfile"];
if (windows) arguments_.push("-ExecutionPolicy", "Bypass");
arguments_.push("-File", script, ...scriptArguments);

const result = spawnSync(executable, arguments_, { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
