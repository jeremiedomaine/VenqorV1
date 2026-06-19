"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_ACOMPTE_EMAIL_INTRO,
  DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  DEFAULT_PAYMENT_EMAIL_INTRO,
  DEFAULT_PAYMENT_EMAIL_SUBJECT,
} from "@/lib/automation-settings";

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

export async function updatePaymentAutomationSettings(
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const automation_paiement_active =
    formData.get("automation_paiement_active") === "on";

  const email_paiement_objet = String(
    formData.get("email_paiement_objet") ?? DEFAULT_PAYMENT_EMAIL_SUBJECT,
  ).trim();

  const email_paiement_intro = String(
    formData.get("email_paiement_intro") ?? DEFAULT_PAYMENT_EMAIL_INTRO,
  ).trim();

  if (!email_paiement_objet) {
    return { error: "L'objet de l'email est requis." };
  }

  if (!email_paiement_intro) {
    return { error: "Le message d'introduction est requis." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      automation_paiement_active,
      email_paiement_objet,
      email_paiement_intro,
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
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

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

  if (!email_acompte_objet) {
    return { error: "L'objet de l'email acompte est requis." };
  }

  if (!email_acompte_intro) {
    return { error: "Le message d'introduction acompte est requis." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      automation_acompte_active,
      acompte_signature_timing,
      email_acompte_objet,
      email_acompte_intro,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/automatisations");
  revalidatePath("/parametres");
  return {};
}
