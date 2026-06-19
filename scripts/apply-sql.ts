/**
 * Exécute un fichier SQL via DATABASE_URL.
 * Usage: npx tsx scripts/apply-sql.ts supabase/migrations/002_event_notes.sql
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const file = process.argv[2];
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!file || !databaseUrl) {
  console.error("Usage: npx tsx scripts/apply-sql.ts <fichier.sql>");
  process.exit(1);
}

async function main() {
  const postgres = await import("postgres");
  const sql = postgres.default(databaseUrl!, { max: 1 });
  try {
    await sql.unsafe(readFileSync(resolve(process.cwd(), file), "utf8"));
    console.log(`✓ ${file}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
