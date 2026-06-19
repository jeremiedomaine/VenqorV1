/**
 * Applique supabase/migrations/*.sql via DATABASE_URL.
 * Usage: npm run db:migrate
 */
import { config } from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const databaseUrl = process.env.DATABASE_URL?.trim();

async function main() {
  if (!databaseUrl) {
    console.error(`
DATABASE_URL manquant dans .env.local

1. Supabase → Settings → Database → Connection string (URI, pooler)
2. Ajoute DATABASE_URL dans .env.local
3. Relance : npm run db:migrate

Ou colle le contenu de supabase/migrations/001_initial_schema.sql
dans le SQL Editor Supabase.
`);
    process.exit(1);
  }

  const postgres = await import("postgres");
  const sql = postgres.default(databaseUrl, { max: 1 });
  try {
    for (const file of files) {
      const content = readFileSync(resolve(migrationsDir, file), "utf8");
      await sql.unsafe(content);
      console.log(`✓ ${file}`);
    }
    console.log("\n✓ Migrations appliquées");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
