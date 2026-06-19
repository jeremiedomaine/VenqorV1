/**
 * Bloque `npm run build` si le serveur dev est actif.
 * Un build pendant `next dev` corrompt .next → page sans CSS, texte collé.
 */
import { existsSync } from "fs";
import { resolve } from "path";

const PORT = Number(process.env.PORT || 3000);
const LOCK = resolve(process.cwd(), ".venqor-dev.lock");

function portInUse(): boolean {
  try {
    const { execSync } = require("child_process") as typeof import("child_process");
    const pids = execSync(`lsof -ti:${PORT}`, { encoding: "utf8" }).trim();
    return Boolean(pids);
  } catch {
    return false;
  }
}

if (existsSync(LOCK) || portInUse()) {
  console.error("");
  console.error("  Build refusé : le serveur dev est actif.");
  console.error("");
  console.error("  Symptôme si vous forcez : page sans mise en forme");
  console.error("  (Venqor.PipelinePilotage… tout collé, plus de styles).");
  console.error("");
  console.error("  → Arrêtez le dev (Ctrl+C dans le terminal)");
  console.error("  → Puis : npm run build");
  console.error("  → Ou réparez : npm run dev:clean");
  console.error("");
  process.exit(1);
}
