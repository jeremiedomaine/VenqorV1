/**
 * Fusionne les workspaces en doublon, nettoie les dossiers et insère des événements de démo.
 * Usage: npm run db:seed
 *
 * Cible le workspace du compte PRIMARY_OWNER_EMAIL (défaut: jeremie.thomasse@gmail.com).
 */
import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { cleanWorkspaceEvents, seedDemoWorkspace } from "./demo-data";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PRIMARY_OWNER_EMAIL =
  process.env.SEED_OWNER_EMAIL ?? "jeremie.thomasse@gmail.com";

async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function removeStoragePrefix(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
) {
  const { data: entries } = await supabase.storage.from(bucket).list(prefix);
  if (!entries?.length) return;

  const paths = entries.map((f) => `${prefix}/${f.name}`);
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.warn(`  ⚠ Storage ${bucket}/${prefix}: ${error.message}`);
  }
}

async function mergeDuplicateWorkspaces(
  supabase: SupabaseClient,
  primaryWorkspaceId: string,
) {
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, nom_domaine");

  const duplicates = (workspaces ?? []).filter((w) => w.id !== primaryWorkspaceId);
  if (!duplicates.length) {
    console.log("→ Aucun workspace doublon à supprimer.");
    return;
  }

  for (const dup of duplicates) {
    console.log(`→ Suppression workspace doublon ${dup.nom_domaine} (${dup.id})…`);

    await removeStoragePrefix(supabase, "workspace-contrats", dup.id);
    await removeStoragePrefix(supabase, "workspace-logos", dup.id);

    const { data: orphanProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("workspace_id", dup.id);

    const { error: delErr } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", dup.id);

    if (delErr) {
      console.error(`✗ Impossible de supprimer ${dup.id}:`, delErr.message);
      continue;
    }

    for (const profile of orphanProfiles ?? []) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(profile.id);
      if (authErr) {
        console.warn(`  ⚠ Compte auth ${profile.id}: ${authErr.message}`);
      } else {
        console.log(`  · Compte auth orphelin supprimé (${profile.id})`);
      }
    }
  }
}

async function main() {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const ownerId = await findUserIdByEmail(supabase, PRIMARY_OWNER_EMAIL);
  if (!ownerId) {
    console.error(`✗ Compte introuvable : ${PRIMARY_OWNER_EMAIL}`);
    process.exit(1);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", ownerId)
    .single();

  if (profileErr || !profile) {
    console.error("✗ Profil gérant introuvable.");
    process.exit(1);
  }

  const workspaceId = profile.workspace_id;
  console.log(`→ Workspace principal (${PRIMARY_OWNER_EMAIL}) : ${workspaceId}`);

  await mergeDuplicateWorkspaces(supabase, workspaceId);
  await cleanWorkspaceEvents(supabase, workspaceId);

  const created = await seedDemoWorkspace(supabase, workspaceId);

  const { count: wsCount } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true });

  console.log(`\n✓ ${created} événements de démo créés`);
  console.log("  · Répartition 2025–2028 · acompte 50 % / solde 50 %");
  console.log(`  · ${wsCount ?? 1} workspace actif`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
