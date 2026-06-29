"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_BILLING } from "@/lib/billing";
import { actionError, type ActionResult } from "@/lib/action-result";
import {
  parseCustomEventTypes,
  RESERVED_EVENT_TYPE_SLUGS,
  slugifyEventType,
} from "@/lib/event-types";
import { requireWorkspaceClient } from "@/lib/workspace-session";

export async function updateWorkspaceBilling(
  formData: FormData,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const acomptePct = Number(
    formData.get("facturation_acompte_pct") ||
      DEFAULT_BILLING.facturation_acompte_pct,
  );
  const soldePct = Number(
    formData.get("facturation_solde_pct") ||
      DEFAULT_BILLING.facturation_solde_pct,
  );

  if (acomptePct + soldePct !== 100) {
    return actionError("Acompte et solde doivent totaliser 100 %.");
  }

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
      facturation_configuree: true,
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer la facturation.");
  revalidatePath("/parametres");
  revalidatePath("/pilotage");
  return {};
}

export async function updateWorkspaceGoals(
  formData: FormData,
): Promise<{ error?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

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

export async function updateWorkspaceContact(
  formData: FormData,
): Promise<{ error?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactNom = String(formData.get("contact_nom") ?? "").trim();
  const contactTelephone = String(formData.get("contact_telephone") ?? "").trim();

  if (!contactEmail) {
    return { error: "Renseignez l'email de contact du domaine." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Format d'email invalide." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      contact_email: contactEmail,
      contact_nom: contactNom,
      contact_telephone: contactTelephone,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  revalidatePath("/parametres");
  revalidatePath("/automatisations");
  return {};
}

export async function updateWorkspaceEncaissements(
  formData: FormData,
): Promise<{ error?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const iban = String(formData.get("iban") ?? "").replace(/\s/g, "").trim();
  const bic = String(formData.get("bic") ?? "").trim();
  const titulaire = String(formData.get("titulaire_compte") ?? "").trim();
  const instructions = String(formData.get("instructions_virement") ?? "").trim();

  if (iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/i.test(iban)) {
    return { error: "Format IBAN invalide." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      mode_paiement_defaut: "virement",
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

export async function addCustomEventType(
  formData: FormData,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return actionError("Indiquez un nom pour le type.");

  const slug = slugifyEventType(label);
  if (RESERVED_EVENT_TYPE_SLUGS.has(slug)) {
    return actionError("Ce nom est réservé.");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("types_evenement_custom")
    .eq("id", workspaceId)
    .single();

  const current = parseCustomEventTypes(workspace?.types_evenement_custom);
  if (current.some((t) => t.slug === slug)) {
    return actionError("Un type avec ce nom existe déjà.");
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      types_evenement_custom: [...current, { slug, label }],
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'ajouter le type.");
  revalidatePath("/parametres");
  revalidatePath("/");
  revalidatePath("/evenements", "layout");
  return {};
}

export async function removeCustomEventType(
  formData: FormData,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return actionError("Type introuvable.");

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

  if (error) return actionError("Impossible de supprimer le type.");
  revalidatePath("/parametres");
  revalidatePath("/");
  return {};
}
