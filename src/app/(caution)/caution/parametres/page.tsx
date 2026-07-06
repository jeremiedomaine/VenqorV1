import { CautionStripeSettings } from "@/components/caution/caution-stripe-settings";
import { loadWorkspace } from "@/lib/load-workspace";
import { stripeConnectFromWorkspace } from "@/lib/stripe-connect-status";

export default async function CautionParametresPage({
  searchParams,
}: {
  searchParams: { stripe?: string };
}) {
  const { workspace } = await loadWorkspace();
  const connectStatus = stripeConnectFromWorkspace(workspace);
  const defaultAmount = workspace?.caution_montant_defaut
    ? Number(workspace.caution_montant_defaut)
    : null;

  return (
    <CautionStripeSettings
      connectStatus={connectStatus}
      defaultAmount={defaultAmount}
      stripeReturn={searchParams.stripe === "return"}
    />
  );
}
