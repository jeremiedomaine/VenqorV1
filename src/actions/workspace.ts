"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  parseCustomEventTypes,
  RESERVED_EVENT_TYPE_SLUGS,
  slugifyEventType,
} from "@/lib/event-types";

async function getWorkspaceId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable");
  return profile.workspace_id;
}

export async function updateWorkspaceBilling(formData: FormData): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const acomptePct = Number(formData.get("facturation_acompte_pct") || 30);
  const soldePct = Number(formData.get("facturation_solde_pct") || 70);

  const { error } = await supabase
    .from("workspaces")
    .update({
      facturation_acompte_label: String(
        formData.get("facturation_acompte_label") || "Acompte",
      ),
      facturation_acompte_pct: acomptePct,
      facturation_acompte_jours: Number(
        formData.get("facturation_acompte_jours") || 0,
      ),
      facturation_solde_label: String(
        formData.get("facturation_solde_label") || "Solde",
      ),
      facturation_solde_pct: soldePct,
      facturation_solde_jours: Number(
        formData.get("facturation_solde_jours") || -30,
      ),
    })
    .eq("id", workspaceId);

  if (error) return;
  revalidatePath("/parametres");
  revalidatePath("/pilotage");
}

export async function updateWorkspaceGoals(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const dossiersRaw = String(
    formData.get("objectif_dossiers_annuel") ?? "",
  ).trim();
  const caRaw = String(formData.get("objectif_ca_annuel") ?? "").trim();

  const objectif_dossiers_annuel = dossiersRaw
    ? Number.parseInt(dossiersRaw, 10)
    : null;
  const objectif_ca_annuel = caRaw
    ? Number.parseFloat(caRaw.replace(/\s/g, "").replace(",", "."))
    : null;

  if (
    objectif_dossiers_annuel !== null &&
    (!Number.isFinite(objectif_dossiers_annuel) ||
      objectif_dossiers_annuel <= 0)
  ) {
    return { error: "L'objectif dossiers doit être un nombre positif." };
  }

  if (
    objectif_ca_annuel !== null &&
    (!Number.isFinite(objectif_ca_annuel) || objectif_ca_annuel <= 0)
  ) {
    return { error: "L'objectif CA doit être un montant positif." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      objectif_dossiers_annuel,
      objectif_ca_annuel,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/parametres");
  revalidatePath("/pilotage");
  return {};
}

export async function updateWorkspaceEncaissements(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const mode = String(formData.get("mode_paiement_defaut") ?? "virement");
  if (mode !== "virement" && mode !== "stripe") {
    return { error: "Mode de paiement invalide." };
  }

  const iban = String(formData.get("iban") ?? "").replace(/\s/g, "").trim();
  const bic = String(formData.get("bic") ?? "").trim();
  const titulaire = String(formData.get("titulaire_compte") ?? "").trim();
  const instructions = String(formData.get("instructions_virement") ?? "").trim();

  if (mode === "virement" && iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/i.test(iban)) {
    return { error: "Format IBAN invalide." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      mode_paiement_defaut: mode,
      iban: iban || null,
      bic: bic || null,
      titulaire_compte: titulaire || null,
      instructions_virement: instructions,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/parametres");
  revalidatePath("/portail", "layout");
  return {};
}

export async function addCustomEventType(formData: FormData): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const slug = slugifyEventType(label);
  if (RESERVED_EVENT_TYPE_SLUGS.has(slug)) return;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("types_evenement_custom")
    .eq("id", workspaceId)
    .single();

  const current = parseCustomEventTypes(workspace?.types_evenement_custom);
  if (current.some((t) => t.slug === slug)) return;

  const { error } = await supabase
    .from("workspaces")
    .update({
      types_evenement_custom: [...current, { slug, label }],
    })
    .eq("id", workspaceId);

  if (error) return;
  revalidatePath("/parametres");
  revalidatePath("/");
  revalidatePath("/evenements", "layout");
}

export async function removeCustomEventType(formData: FormData): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("types_evenement_custom")
    .eq("id", workspaceId)
    .single();

  const current = parseCustomEventTypes(workspace?.types_evenement_custom);
  const next = current.filter((t) => t.slug !== slug);

  const { error } = await supabase
    .from("workspaces")
    .update({ types_evenement_custom: next })
    .eq("id", workspaceId);

  if (error) return;
  revalidatePath("/parametres");
  revalidatePath("/");
}
