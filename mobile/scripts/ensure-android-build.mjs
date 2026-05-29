import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = join(root, "android");

const jdk21Paths = [
  process.env.JAVA_HOME,
  "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
  "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
];

function resolveJdk21() {
  for (const home of jdk21Paths) {
    if (!home || !existsSync(join(home, "bin", "java"))) continue;
    try {
      const out = execSync(`"${join(home, "bin", "java")}" -version 2>&1`, {
        encoding: "utf8",
      });
      if (/version "21[.\s]/.test(out) || /openjdk version "21/.test(out)) {
        return home;
      }
    } catch {
      /* try next */
    }
  }
  try {
    const home = execSync("/usr/libexec/java_home -v 21 2>/dev/null", {
      encoding: "utf8",
    }).trim();
    if (home) return home;
  } catch {
    /* Gradle toolchain may auto-download JDK 21 */
  }
  return null;
}

const javaHome = resolveJdk21();
const env = { ...process.env };
if (javaHome) {
  env.JAVA_HOME = javaHome;
  console.log(`Using JAVA_HOME=${javaHome}`);
} else {
  console.log(
    "JDK 21 not found locally; Gradle will try to auto-download it (first build may take a few minutes)."
  );
  console.log(
    "Or install manually: brew install openjdk@21 && export JAVA_HOME=$(/usr/libexec/java_home -v 21)"
  );
}

const result = spawnSync("./gradlew", ["installDebug"], {
  cwd: androidDir,
  env,
  stdio: "inherit",
});

if (result.status !== 0) {
  console.error(
    "\nBuild failed. Capacitor Android needs Java 21.\n" +
      "  brew install openjdk@21\n" +
      "  export JAVA_HOME=\"$(/usr/libexec/java_home -v 21)\"\n" +
      "  npm run install:debug\n"
  );
  process.exit(result.status ?? 1);
}
