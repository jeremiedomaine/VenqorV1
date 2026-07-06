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
