import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_RELANCE_PRESETS,
  type RelanceRegle,
} from "@/lib/relance-presets";

export async function ensureDefaultRelanceRules(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<RelanceRegle[]> {
  const { data: existing } = await supabase
    .from("relance_regles")
    .select("preset_key")
    .eq("workspace_id", workspaceId);

  const existingKeys = new Set((existing ?? []).map((r) => r.preset_key));
  const missing = DEFAULT_RELANCE_PRESETS.filter(
    (p) => !existingKeys.has(p.preset_key),
  );

  if (missing.length) {
    await supabase.from("relance_regles").insert(
      missing.map((preset) => ({
        workspace_id: workspaceId,
        preset_key: preset.preset_key,
        nom: preset.nom,
        active: preset.default_active,
        cible: preset.cible,
        declencheur: preset.declencheur,
        delai_jours: preset.delai_jours,
        email_objet: preset.email_objet,
        email_intro: preset.email_intro,
      })),
    );
  }

  const { data: rules, error } = await supabase
    .from("relance_regles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (rules ?? []) as RelanceRegle[];
}

export async function loadRelanceRulesForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<RelanceRegle[]> {
  return ensureDefaultRelanceRules(supabase, workspaceId);
}
