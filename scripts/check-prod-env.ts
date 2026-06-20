/**
 * Vérifie la configuration prod (Vercel) — sans afficher les secrets.
 * Usage: npm run prod:check
 */
import { execSync } from "child_process";

type Check = { name: string; ok: boolean; detail: string };

function runVercelEnvLs(environment: string): string {
  return execSync(`npx vercel env ls ${environment}`, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function envPresent(listOutput: string, name: string): boolean {
  return listOutput.split("\n").some((line) => line.trim().startsWith(name));
}

function main() {
  const checks: Check[] = [];

  let prodList = "";
  try {
    prodList = runVercelEnvLs("production");
  } catch (err) {
    console.error("✗ Impossible de lire les variables Vercel (vercel login ?)");
    process.exit(1);
  }

  const required = [
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PUBLIC_SITE_URL",
    "CRON_SECRET",
    "YOUSIGN_API_KEY",
    "YOUSIGN_API_BASE",
    "YOUSIGN_WEBHOOK_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "VENQOR_ADMIN_EMAILS",
  ];

  for (const name of required) {
    checks.push({
      name,
      ok: envPresent(prodList, name),
      detail: envPresent(prodList, name) ? "présente" : "MANQUANTE",
    });
  }

  checks.push({
    name: "EMAIL_TEST_OVERRIDE",
    ok: !envPresent(prodList, "EMAIL_TEST_OVERRIDE"),
    detail: envPresent(prodList, "EMAIL_TEST_OVERRIDE")
      ? "présente — à retirer en prod"
      : "absente (ok)",
  });

  console.log("\n=== Venqor — audit env Production (Vercel) ===\n");
  let failed = 0;
  for (const c of checks) {
    const icon = c.ok ? "✓" : "✗";
    console.log(`${icon} ${c.name}: ${c.detail}`);
    if (!c.ok) failed++;
  }

  console.log("\n--- Tests HTTP app.venqor.app ---\n");

  try {
    const cronStatus = execSync(
      'curl -s -o /dev/null -w "%{http_code}" https://app.venqor.app/api/cron/solde-payment',
      { encoding: "utf8" },
    ).trim();
    const cronOk = cronStatus === "401";
    console.log(
      `${cronOk ? "✓" : "✗"} Cron sans auth → ${cronStatus} (attendu 401)`,
    );
    if (!cronOk) failed++;
  } catch {
    console.log("✗ Cron: test HTTP impossible");
    failed++;
  }

  try {
    const whStatus = execSync(
      'curl -s -o /dev/null -w "%{http_code}" -X POST https://app.venqor.app/api/webhooks/yousign -H "Content-Type: application/json" -d "{}"',
      { encoding: "utf8" },
    ).trim();
    const whOk = whStatus === "401";
    console.log(
      `${whOk ? "✓" : "✗"} Webhook Yousign sans signature → ${whStatus} (attendu 401)`,
    );
    if (!whOk) failed++;
  } catch {
    console.log("✗ Webhook: test HTTP impossible");
    failed++;
  }

  console.log(
    "\nNote: vérifiez manuellement que NEXT_PUBLIC_SITE_URL = https://app.venqor.app",
  );
  console.log(
    "      et YOUSIGN_API_BASE = prod (https://api.yousign.app/v3) quand vous signez de vrais contrats.\n",
  );

  if (failed > 0) {
    console.log(`✗ ${failed} point(s) à corriger.\n`);
    process.exit(1);
  }

  console.log("✓ Configuration prod OK.\n");
}

main();
