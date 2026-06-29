/**
 * Crée (ou réinitialise) le compte démo commercial avec fausses données.
 *
 * Usage: npm run db:setup-demo
 *
 * Variables (.env.local) :
 *   DEMO_ACCOUNT_EMAIL    — défaut demo@venqor.app
 *   DEMO_ACCOUNT_PASSWORD — défaut VenqorDemo2026!
 *   DEMO_ACCOUNT_NAME     — défaut Équipe commerciale Venqor
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { cleanWorkspaceEvents, seedDemoWorkspace } from "./demo-data";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_EMAIL = process.env.DEMO_ACCOUNT_EMAIL ?? "demo@venqor.app";
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD ?? "VenqorDemo2026!";
const DEMO_NAME = process.env.DEMO_ACCOUNT_NAME ?? "Équipe commerciale Venqor";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.venqor.app";

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return (
    data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ??
    null
  );
}

async function main() {
  if (!url || !serviceKey) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  let userId = await findUserIdByEmail(DEMO_EMAIL);

  if (userId) {
    console.log(`→ Compte existant : ${DEMO_EMAIL}`);
    const { error: pwdErr } = await supabase.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      user_metadata: { full_name: DEMO_NAME, is_demo_account: true },
    });
    if (pwdErr) {
      console.warn(`  ⚠ Mot de passe non mis à jour : ${pwdErr.message}`);
    }
  } else {
    console.log(`→ Création du compte démo : ${DEMO_EMAIL}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, is_demo_account: true },
    });
    if (error || !data.user) {
      console.error("✗ Création utilisateur :", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`  · Utilisateur créé (${userId})`);
  }

  // Attendre le trigger handle_new_user (workspace + profile)
  await new Promise((r) => setTimeout(r, 1500));

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("workspace_id, full_name")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    console.error("✗ Profil introuvable après création.");
    process.exit(1);
  }

  await supabase
    .from("profiles")
    .update({ full_name: DEMO_NAME })
    .eq("id", userId);

  const workspaceId = profile.workspace_id;
  console.log(`→ Workspace démo : ${workspaceId}`);

  await cleanWorkspaceEvents(supabase, workspaceId);

  const { error: relanceErr } = await supabase.rpc("seed_default_relance_rules", {
    p_workspace_id: workspaceId,
  });
  if (relanceErr) {
    console.warn(`  ⚠ Relances par défaut : ${relanceErr.message}`);
  }

  const created = await seedDemoWorkspace(supabase, workspaceId);

  console.log("\n✓ Compte démo prêt");
  console.log(`  · URL      : ${SITE_URL}/login`);
  console.log(`  · Email    : ${DEMO_EMAIL}`);
  console.log(`  · Mot de passe : ${DEMO_PASSWORD}`);
  console.log(`  · ${created} dossiers (2025–2028, mariages + événements pro)`);
  console.log("  · Workspace configuré (contact, IBAN, échéancier, objectifs)");
  console.log("\n  ⚠ Contrat électronique : config Venqor requise (normal en démo).");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
