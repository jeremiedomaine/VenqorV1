/**
 * Crée le compte démo « Venqor Caution » (product_mode = caution_only).
 * Usage: npm run db:setup-caution-demo
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CAUTION_EMAIL = process.env.CAUTION_DEMO_EMAIL ?? "caution@venqor.app";
const CAUTION_PASSWORD = process.env.CAUTION_DEMO_PASSWORD ?? "VenqorCaution2026!";
const CAUTION_NAME = process.env.CAUTION_DEMO_NAME ?? "Karine Lopez";
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
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  let userId = await findUserIdByEmail(CAUTION_EMAIL);

  if (userId) {
    console.log(`→ Compte existant : ${CAUTION_EMAIL}`);
    await supabase.auth.admin.updateUserById(userId, {
      password: CAUTION_PASSWORD,
      user_metadata: { full_name: CAUTION_NAME },
    });
  } else {
    console.log(`→ Création : ${CAUTION_EMAIL}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: CAUTION_EMAIL,
      password: CAUTION_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: CAUTION_NAME },
    });
    if (error || !data.user) {
      console.error("✗", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
  }

  await new Promise((r) => setTimeout(r, 1500));

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    console.error("✗ Profil introuvable.");
    process.exit(1);
  }

  await supabase
    .from("workspaces")
    .update({
      product_mode: "caution_only",
      nom_domaine: "La Ferme de la Loge",
      contact_nom: CAUTION_NAME,
      contact_email: CAUTION_EMAIL,
      onboarding_completed_at: new Date().toISOString(),
      facturation_configuree: true,
      caution_montant_defaut: 500,
    })
    .eq("id", profile.workspace_id);

  await supabase
    .from("profiles")
    .update({ full_name: CAUTION_NAME })
    .eq("id", userId);

  console.log("\n✓ Compte Venqor Caution prêt");
  console.log(`  · URL      : ${SITE_URL}/caution`);
  console.log(`  · Email    : ${CAUTION_EMAIL}`);
  console.log(`  · Mot de passe : ${CAUTION_PASSWORD}`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
