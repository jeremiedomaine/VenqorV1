import type { Workspace } from "@/lib/types";

export type StripeConnectStatus = {
  configured: boolean;
  accountId: string | null;
  onboardedAt: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  ready: boolean;
  isDemo: boolean;
};

export function isStripePlatformConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function stripeConnectFromWorkspace(
  workspace: Pick<
    Workspace,
    | "stripe_connect_account_id"
    | "stripe_connect_onboarded_at"
    | "stripe_connect_charges_enabled"
    | "stripe_connect_payouts_enabled"
    | "stripe_active"
  > | null,
): StripeConnectStatus {
  if (!workspace?.stripe_connect_account_id) {
    return {
      configured: false,
      accountId: null,
      onboardedAt: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      ready: false,
      isDemo: false,
    };
  }

  const isDemo = workspace.stripe_connect_account_id.startsWith("acct_demo_");
  const chargesEnabled =
    workspace.stripe_connect_charges_enabled || workspace.stripe_active;
  const payoutsEnabled = workspace.stripe_connect_payouts_enabled;

  return {
    configured: true,
    accountId: workspace.stripe_connect_account_id,
    onboardedAt: workspace.stripe_connect_onboarded_at,
    chargesEnabled,
    payoutsEnabled,
    ready: chargesEnabled,
    isDemo,
  };
}

export function formatStripeAccountLabel(accountId: string): string {
  if (accountId.startsWith("acct_demo_")) return "Compte démo (simulation)";
  return `${accountId.slice(0, 12)}…`;
}
