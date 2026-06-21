"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceClient } from "@/lib/workspace-session";
import {
  DEFAULT_ACOMPTE_EMAIL_INTRO,
  DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  DEFAULT_ACOMPTE_EMAIL_CTA,
  DEFAULT_ACOMPTE_EMAIL_DETAILS,
  DEFAULT_ACOMPTE_EMAIL_TITLE,
  DEFAULT_PAYMENT_EMAIL_INTRO,
  DEFAULT_PAYMENT_EMAIL_SUBJECT,
  DEFAULT_PAYMENT_EMAIL_CTA,
  DEFAULT_PAYMENT_EMAIL_DETAILS,
  DEFAULT_PAYMENT_EMAIL_TITLE,
} from "@/lib/automation-settings";

export async function updatePaymentAutomationSettings(
  formData: FormData,
): Promise<{ error?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const automation_paiement_active =
    formData.get("automation_paiement_active") === "on";

  const email_paiement_objet = String(
    formData.get("email_paiement_objet") ?? DEFAULT_PAYMENT_EMAIL_SUBJECT,
  ).trim();
  const email_paiement_intro = String(
    formData.get("email_paiement_intro") ?? DEFAULT_PAYMENT_EMAIL_INTRO,
  ).trim();
  const email_paiement_titre = String(
    formData.get("email_paiement_titre") ?? DEFAULT_PAYMENT_EMAIL_TITLE,
  ).trim();
  const email_paiement_cta = String(
    formData.get("email_paiement_cta") ?? DEFAULT_PAYMENT_EMAIL_CTA,
  ).trim();
  const email_paiement_details = String(
    formData.get("email_paiement_details") ?? DEFAULT_PAYMENT_EMAIL_DETAILS,
  ).trim();

  if (!email_paiement_objet) {
    return { error: "L'objet de l'email est requis." };
  }
  if (!email_paiement_intro) {
    return { error: "Le message est requis." };
  }
  if (!email_paiement_titre) {
    return { error: "Le titre est requis." };
  }
  if (!email_paiement_cta) {
    return { error: "Le libellé du bouton est requis." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      automation_paiement_active,
      email_paiement_objet,
      email_paiement_intro,
      email_paiement_titre,
      email_paiement_cta,
      email_paiement_details,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/automatisations");
  revalidatePath("/parametres");
  return {};
}

export async function updateDepositAutomationSettings(
  formData: FormData,
): Promise<{ error?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const automation_acompte_active =
    formData.get("automation_acompte_active") === "on";

  const timingRaw = String(formData.get("acompte_signature_timing") ?? "");
  const acompte_signature_timing =
    timingRaw === "with_contract" ? "with_contract" : "after_contract";

  const email_acompte_objet = String(
    formData.get("email_acompte_objet") ?? DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  ).trim();
  const email_acompte_intro = String(
    formData.get("email_acompte_intro") ?? DEFAULT_ACOMPTE_EMAIL_INTRO,
  ).trim();
  const email_acompte_titre = String(
    formData.get("email_acompte_titre") ?? DEFAULT_ACOMPTE_EMAIL_TITLE,
  ).trim();
  const email_acompte_cta = String(
    formData.get("email_acompte_cta") ?? DEFAULT_ACOMPTE_EMAIL_CTA,
  ).trim();
  const email_acompte_details = String(
    formData.get("email_acompte_details") ?? DEFAULT_ACOMPTE_EMAIL_DETAILS,
  ).trim();

  if (!email_acompte_objet) {
    return { error: "L'objet de l'email acompte est requis." };
  }
  if (!email_acompte_intro) {
    return { error: "Le message acompte est requis." };
  }
  if (!email_acompte_titre) {
    return { error: "Le titre est requis." };
  }
  if (!email_acompte_cta) {
    return { error: "Le libellé du bouton est requis." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      automation_acompte_active,
      acompte_signature_timing,
      email_acompte_objet,
      email_acompte_intro,
      email_acompte_titre,
      email_acompte_cta,
      email_acompte_details,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/automatisations");
  revalidatePath("/parametres");
  return {};
}
