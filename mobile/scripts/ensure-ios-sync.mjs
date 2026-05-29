#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iosAppDir = join(root, "ios", "App");

const XCODE_CANDIDATES = [
  process.env.XCODE_PATH,
  process.env.DEVELOPER_DIR,
  "/Applications/Xcode.app/Contents/Developer",
  "/Volumes/SSD1/Applications/Xcode.app/Contents/Developer",
].filter(Boolean);

function resolveDeveloperDir() {
  if (process.env.DEVELOPER_DIR && existsSync(process.env.DEVELOPER_DIR)) {
    return process.env.DEVELOPER_DIR;
  }

  for (const candidate of XCODE_CANDIDATES) {
    const developerDir = candidate.endsWith("/Contents/Developer")
      ? candidate
      : join(candidate, "Contents/Developer");
    if (existsSync(join(developerDir, "usr", "bin", "xcodebuild"))) {
      return developerDir;
    }
  }

  const current = spawnSync("xcode-select", ["-p"], { encoding: "utf8" });
  const active = current.stdout?.trim();
  if (
    active &&
    !active.includes("CommandLineTools") &&
    existsSync(join(active, "usr", "bin", "xcodebuild"))
  ) {
    return active;
  }

  return null;
}

function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const developerDir = resolveDeveloperDir();

if (!developerDir) {
  console.error(
    "\nCould not find a full Xcode installation.\n" +
      "Install Xcode, or set DEVELOPER_DIR / XCODE_PATH to your .app bundle or Contents/Developer path.\n" +
      "Example:\n" +
      "  export DEVELOPER_DIR=/Volumes/SSD1/Applications/Xcode.app/Contents/Developer\n" +
      "  npm run pod:install\n"
  );
  process.exit(1);
}

const env = { ...process.env, DEVELOPER_DIR: developerDir };

if (!process.env.DEVELOPER_DIR?.includes("CommandLineTools")) {
  console.log(`Using Xcode at ${developerDir}`);
}

const activeSelect = spawnSync("xcode-select", ["-p"], { encoding: "utf8" })
  .stdout?.trim();
if (activeSelect?.includes("CommandLineTools")) {
  console.log(
    "Note: xcode-select still points at Command Line Tools. This script uses DEVELOPER_DIR for this run.\n" +
      "For a permanent fix:\n" +
      `  sudo xcode-select -s ${developerDir}\n`
  );
}

console.log("Syncing Capacitor iOS project…");
run("npx", ["cap", "sync", "ios"], root, env);

console.log("\nInstalling CocoaPods dependencies…");
const pod = spawnSync("pod", ["install"], {
  cwd: iosAppDir,
  stdio: "inherit",
  env,
});

if (pod.status !== 0) {
  console.error(
    "\niOS pod install failed.\n" +
      "  1. Ensure Xcode is installed and licensed: sudo xcodebuild -license accept\n" +
      `  2. Point tools at Xcode: sudo xcode-select -s ${developerDir}\n` +
      "  3. Retry: npm run pod:install\n"
  );
  process.exit(pod.status ?? 1);
}

console.log("\niOS project is ready. Open with: npm run open:ios");
