"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, type ActionResult } from "@/lib/action-result";
import {
  createStripeConnectOnboardingUrl,
  stripeConnectReturnUrl,
} from "@/lib/stripe-connect";
import { isStripePlatformConfigured } from "@/lib/stripe-connect-status";
import { requireWorkspaceClient } from "@/lib/workspace-session";

/** Simulation démo quand Stripe n'est pas encore branché en prod. */
export async function simulateStripeConnectDemo(): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  if (isStripePlatformConfigured()) {
    return actionError(
      "Stripe est configuré — utilisez le bouton de connexion réelle.",
    );
  }

  const demoAccountId = `acct_demo_${workspaceId.slice(0, 8)}`;

  const { error } = await supabase
    .from("workspaces")
    .update({
      stripe_connect_account_id: demoAccountId,
      stripe_connect_onboarded_at: new Date().toISOString(),
      stripe_connect_charges_enabled: true,
      stripe_connect_payouts_enabled: true,
      stripe_active: true,
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer la connexion démo.");

  revalidatePath("/caution");
  revalidatePath("/caution/parametres");
  return {};
}

export async function startStripeConnectOnboarding(): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("stripe_connect_account_id")
    .eq("id", workspaceId)
    .single();

  if (!isStripePlatformConfigured()) {
    return simulateStripeConnectDemo();
  }

  try {
    const { url, accountId } = await createStripeConnectOnboardingUrl(
      workspaceId,
      workspace?.stripe_connect_account_id ?? null,
    );

    if (!workspace?.stripe_connect_account_id) {
      await supabase
        .from("workspaces")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", workspaceId);
    }

    redirect(url);
  } catch (err) {
    return actionError(
      err instanceof Error ? err.message : "Connexion Stripe impossible.",
    );
  }
}

export async function updateCautionDefaults(
  formData: FormData,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const raw = String(formData.get("caution_montant_defaut") ?? "").trim();
  const caution_montant_defaut = raw
    ? Number.parseFloat(raw.replace(",", "."))
    : null;

  if (
    caution_montant_defaut !== null &&
    (!Number.isFinite(caution_montant_defaut) || caution_montant_defaut <= 0)
  ) {
    return actionError("Le montant par défaut doit être un nombre positif.");
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ caution_montant_defaut })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer le montant par défaut.");

  revalidatePath("/caution/parametres");
  revalidatePath("/caution");
  return {};
}

export type CautionAutoSettings = {
  caution_auto_active: boolean;
  caution_auto_jours_avant: number;
  caution_relance_active: boolean;
  caution_relance_jours_avant: number;
};

export async function updateCautionAutoSettings(
  formData: FormData,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const caution_auto_active =
    formData.get("caution_auto_active") === "on";
  const caution_relance_active =
    formData.get("caution_relance_active") === "on";

  const autoJours = Number.parseInt(
    String(formData.get("caution_auto_jours_avant") ?? "7"),
    10,
  );
  const relanceJours = Number.parseInt(
    String(formData.get("caution_relance_jours_avant") ?? "3"),
    10,
  );

  if (!Number.isFinite(autoJours) || autoJours < 1 || autoJours > 90) {
    return actionError(
      "Le délai d'envoi doit être entre 1 et 90 jours avant l'arrivée.",
    );
  }

  if (
    !Number.isFinite(relanceJours) ||
    relanceJours < 0 ||
    relanceJours > 60
  ) {
    return actionError(
      "Le délai de relance doit être entre 0 et 60 jours avant l'arrivée.",
    );
  }

  if (caution_relance_active && relanceJours >= autoJours) {
    return actionError(
      "La relance doit partir après le premier envoi (moins de jours avant l'arrivée).",
    );
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      caution_auto_active,
      caution_auto_jours_avant: autoJours,
      caution_relance_active,
      caution_relance_jours_avant: relanceJours,
    })
    .eq("id", workspaceId);

  if (error) {
    return actionError("Impossible d'enregistrer l'automatisation caution.");
  }

  revalidatePath("/caution/parametres");
  revalidatePath("/caution");
  return {};
}

export async function disconnectStripeConnectDemo(): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("stripe_connect_account_id")
    .eq("id", workspaceId)
    .single();

  if (
    !workspace?.stripe_connect_account_id?.startsWith("acct_demo_") &&
    isStripePlatformConfigured()
  ) {
    return actionError(
      "Déconnexion d'un compte Stripe réel : à faire depuis le dashboard Stripe.",
    );
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      stripe_connect_account_id: null,
      stripe_connect_onboarded_at: null,
      stripe_connect_charges_enabled: false,
      stripe_connect_payouts_enabled: false,
      stripe_active: false,
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible de réinitialiser la connexion.");

  revalidatePath("/caution");
  revalidatePath("/caution/parametres");
  return {};
}

export async function getStripeConnectReturnUrl(): Promise<string> {
  return stripeConnectReturnUrl();
}
