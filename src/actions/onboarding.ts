"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_BILLING } from "@/lib/billing";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireWorkspaceClient } from "@/lib/workspace-session";

function revalidateWorkspacePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/parametres");
  revalidatePath("/portail", "layout");
}

export async function saveOnboardingDomain(
  formData: FormData,
): Promise<ActionResult> {
  const nomDomaine = String(formData.get("nom_domaine") ?? "").trim();
  if (!nomDomaine) {
    return actionError("Indiquez le nom de votre domaine.");
  }

  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { error } = await supabase
    .from("workspaces")
    .update({ nom_domaine: nomDomaine })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer le nom du domaine.");
  revalidateWorkspacePaths();
  return {};
}

export async function saveOnboardingGoals(
  formData: FormData,
): Promise<ActionResult> {
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
    return actionError("L'objectif dossiers doit être un nombre positif.");
  }

  if (
    objectif_ca_annuel !== null &&
    (!Number.isFinite(objectif_ca_annuel) || objectif_ca_annuel <= 0)
  ) {
    return actionError("L'objectif CA doit être un montant positif.");
  }

  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { error } = await supabase
    .from("workspaces")
    .update({ objectif_dossiers_annuel, objectif_ca_annuel })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer les objectifs.");
  revalidateWorkspacePaths();
  return {};
}

export async function saveOnboardingBilling(
  formData: FormData,
): Promise<ActionResult> {
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

  const { workspaceId, supabase } = await requireWorkspaceClient();

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
  revalidateWorkspacePaths();
  return {};
}

export async function saveOnboardingIban(
  formData: FormData,
): Promise<ActionResult> {
  const iban = String(formData.get("iban") ?? "").replace(/\s/g, "").trim();
  const titulaire = String(formData.get("titulaire_compte") ?? "").trim();

  if (!iban) {
    return actionError("Indiquez votre IBAN pour recevoir les acomptes.");
  }

  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/i.test(iban)) {
    return actionError("Format IBAN invalide.");
  }

  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { error } = await supabase
    .from("workspaces")
    .update({
      mode_paiement_defaut: "virement",
      iban,
      titulaire_compte: titulaire || null,
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer l'IBAN.");
  revalidateWorkspacePaths();
  return {};
}

export async function saveOnboardingEventType(
  formData: FormData,
): Promise<ActionResult> {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return actionError("Indiquez un nom pour le type.");

  const { addCustomEventType } = await import("@/actions/workspace");
  return addCustomEventType(formData);
}

export async function completeOnboarding(): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { error } = await supabase
    .from("workspaces")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible de finaliser l'onboarding.");
  revalidateWorkspacePaths();
  return {};
}
