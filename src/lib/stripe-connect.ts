/**
 * Stripe Connect — onboarding Express (à activer quand STRIPE_SECRET_KEY est défini).
 *
 * Flux production :
 * 1. accounts.create({ type: 'express', country: 'FR', capabilities: { card_payments, transfers } })
 * 2. accountLinks.create({ account, type: 'account_onboarding', return_url, refresh_url })
 * 3. Redirection du gérant vers Stripe
 * 4. Webhook account.updated → maj charges_enabled / payouts_enabled
 */
import { isStripePlatformConfigured } from "@/lib/stripe-connect-status";

export function stripeConnectReturnUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/caution/parametres?stripe=return`;
}

export function stripeConnectRefreshUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/caution/parametres?stripe=refresh`;
}

export async function createStripeConnectOnboardingUrl(
  workspaceId: string,
  existingAccountId: string | null,
): Promise<{ url: string; accountId: string }> {
  void workspaceId;
  void existingAccountId;
  if (!isStripePlatformConfigured()) {
    throw new Error(
      "Stripe n'est pas configuré sur la plateforme (STRIPE_SECRET_KEY manquant).",
    );
  }

  // Brancher ici le SDK Stripe (@stripe/stripe-js côté client, stripe Node côté serveur).
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // ...
  throw new Error(
    "Intégration Stripe Connect en cours de déploiement — contactez Venqor.",
  );
}
