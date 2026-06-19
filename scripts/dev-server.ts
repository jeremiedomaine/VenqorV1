/**
 * Démarre next dev de façon fiable :
 * - un seul processus sur le port 3000
 * - fichier .venqor-dev.lock pour bloquer les builds parallèles
 * - option --clean pour supprimer .next
 */
import { spawn, execSync } from "child_process";
import { existsSync, rmSync, writeFileSync, unlinkSync } from "fs";
import { join, resolve } from "path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const LOCK = resolve(ROOT, ".venqor-dev.lock");
const clean = process.argv.includes("--clean");

function killPort() {
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, { stdio: "ignore" });
  } catch {
    // aucun processus sur le port
  }
}

function removeLock() {
  if (existsSync(LOCK)) unlinkSync(LOCK);
}

if (clean && existsSync(resolve(ROOT, ".next"))) {
  console.log("→ Suppression de .next…");
  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
}

killPort();
removeLock();

writeFileSync(
  LOCK,
  JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
);

console.log(`→ Démarrage sur http://localhost:${PORT}`);

const nextBin = join(ROOT, "node_modules", ".bin", "next");

const child = spawn(nextBin, ["dev", "-p", String(PORT)], {
  cwd: ROOT,
  stdio: "inherit",
});

function shutdown(code?: number) {
  removeLock();
  try {
    child.kill("SIGTERM");
  } catch {
    // déjà arrêté
  }
  process.exit(code ?? 0);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", removeLock);
child.on("exit", (code) => {
  removeLock();
  process.exit(code ?? 0);
});
