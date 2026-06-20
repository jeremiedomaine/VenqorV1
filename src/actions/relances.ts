"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_RELANCE_PRESETS,
  getRelancePreset,
  type RelancePresetKey,
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
  const presetKey = String(formData.get("preset_key") ?? "") as RelancePresetKey;
  const nom = String(formData.get("nom") ?? "").trim();
  const active = formData.get("active") === "on";
  const delai_jours = Number.parseInt(String(formData.get("delai_jours") ?? ""), 10);
  const email_titre = String(formData.get("email_titre") ?? "").trim();
  const email_objet = String(formData.get("email_objet") ?? "").trim();
  const email_intro = String(formData.get("email_intro") ?? "").trim();
  const email_cta_label = String(formData.get("email_cta_label") ?? "").trim();
  const email_footer_note = String(
    formData.get("email_footer_note") ?? "",
  ).trim();

  if (!ruleId) return { error: "Règle introuvable." };
  if (!nom) return { error: "Le nom de l'automatisation est requis." };
  if (!Number.isFinite(delai_jours) || delai_jours < 0 || delai_jours > 365) {
    return { error: "Le délai doit être entre 0 et 365 jours." };
  }
  if (!email_titre) return { error: "Le titre est requis." };
  if (!email_objet) return { error: "L'objet est requis." };
  if (!email_intro) return { error: "Le message est requis." };
  if (!email_cta_label) return { error: "Le libellé du bouton est requis." };

  const preset = getRelancePreset(presetKey);
  if (preset?.declencheur === "echeance_jours_avant" && delai_jours === 0) {
    return { error: "Le rappel avant échéance nécessite au moins 1 jour." };
  }

  const { error } = await supabase
    .from("relance_regles")
    .update({
      nom,
      active,
      delai_jours,
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

export async function createRelanceRule(
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const presetKey = String(formData.get("preset_key") ?? "") as RelancePresetKey;
  const preset = DEFAULT_RELANCE_PRESETS.find((p) => p.preset_key === presetKey);
  if (!preset) return { error: "Modèle introuvable." };

  const { data, error } = await supabase
    .from("relance_regles")
    .insert({
      workspace_id: workspaceId,
      preset_key: preset.preset_key,
      nom: preset.nom,
      active: true,
      cible: preset.cible,
      declencheur: preset.declencheur,
      delai_jours: preset.delai_jours,
      email_titre: preset.email_title,
      email_objet: preset.email_objet,
      email_intro: preset.email_intro,
      email_cta_label: preset.cta_label,
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
