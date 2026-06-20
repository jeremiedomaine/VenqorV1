"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseRelanceStringArray } from "@/lib/relance-filters";
import {
  BLANK_RELANCE_DEFAULTS,
  type RelanceCible,
  type RelanceDeclencheur,
} from "@/lib/relance-presets";

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

function parseDeclencheur(raw: string): RelanceDeclencheur | null {
  if (
    raw === "echeance_jours_avant" ||
    raw === "echeance_jours_apres" ||
    raw === "contrat_jours_apres"
  ) {
    return raw;
  }
  return null;
}

function parseCible(raw: string): RelanceCible | null {
  return raw === "couple" || raw === "domaine" ? raw : null;
}

export async function updateRelancesMasterSwitch(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const relances_actives = formData.get("relances_actives") === "on";

  const { error } = await supabase
    .from("workspaces")
    .update({ relances_actives })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/automatisations");
  return {};
}

export async function updateRelanceRule(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const ruleId = String(formData.get("rule_id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const active = formData.get("active") === "on";
  const delai_jours = Number.parseInt(String(formData.get("delai_jours") ?? ""), 10);
  const declencheur = parseDeclencheur(String(formData.get("declencheur") ?? ""));
  const cible = parseCible(String(formData.get("cible") ?? ""));
  const types_evenement = parseRelanceStringArray(formData.get("types_evenement"));
  const statuts_evenement = parseRelanceStringArray(
    formData.get("statuts_evenement"),
  );
  const email_titre = String(formData.get("email_titre") ?? "").trim();
  const email_objet = String(formData.get("email_objet") ?? "").trim();
  const email_intro = String(formData.get("email_intro") ?? "").trim();
  const email_cta_label = String(formData.get("email_cta_label") ?? "").trim();
  const email_footer_note = String(
    formData.get("email_footer_note") ?? "",
  ).trim();

  if (!ruleId) return { error: "Règle introuvable." };
  if (!nom) return { error: "Le nom de l'automatisation est requis." };
  if (!declencheur) return { error: "Déclencheur invalide." };
  if (!cible) return { error: "Destinataire invalide." };
  if (!Number.isFinite(delai_jours) || delai_jours < 0 || delai_jours > 365) {
    return { error: "Le délai doit être entre 0 et 365 jours." };
  }
  if (declencheur === "echeance_jours_avant" && delai_jours === 0) {
    return { error: "Le rappel avant échéance nécessite au moins 1 jour." };
  }
  if (!statuts_evenement.length) {
    return { error: "Sélectionnez au moins un statut de dossier." };
  }
  if (!email_titre) return { error: "Le titre est requis." };
  if (!email_objet) return { error: "L'objet est requis." };
  if (!email_intro) return { error: "Le message est requis." };
  if (!email_cta_label) return { error: "Le libellé du bouton est requis." };

  const { error } = await supabase
    .from("relance_regles")
    .update({
      nom,
      active,
      declencheur,
      cible,
      delai_jours,
      types_evenement,
      statuts_evenement,
      email_titre,
      email_objet,
      email_intro,
      email_cta_label,
      email_footer_note: email_footer_note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/automatisations");
  return {};
}

export async function createRelanceRule(): Promise<{ error?: string; id?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("relance_regles")
    .insert({
      workspace_id: workspaceId,
      preset_key: "custom",
      nom: BLANK_RELANCE_DEFAULTS.nom,
      active: false,
      cible: BLANK_RELANCE_DEFAULTS.cible,
      declencheur: BLANK_RELANCE_DEFAULTS.declencheur,
      delai_jours: BLANK_RELANCE_DEFAULTS.delai_jours,
      types_evenement: BLANK_RELANCE_DEFAULTS.types_evenement,
      statuts_evenement: BLANK_RELANCE_DEFAULTS.statuts_evenement,
      email_titre: BLANK_RELANCE_DEFAULTS.email_titre,
      email_objet: BLANK_RELANCE_DEFAULTS.email_objet,
      email_intro: BLANK_RELANCE_DEFAULTS.email_intro,
      email_cta_label: BLANK_RELANCE_DEFAULTS.email_cta_label,
      email_footer_note: null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/automatisations");
  return { id: data.id };
}

export async function deleteRelanceRule(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const ruleId = String(formData.get("rule_id") ?? "");
  if (!ruleId) return { error: "Règle introuvable." };

  const { error } = await supabase
    .from("relance_regles")
    .delete()
    .eq("id", ruleId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/automatisations");
  return {};
}
