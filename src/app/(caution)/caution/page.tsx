import { redirect } from "next/navigation";
import { CautionDemoHub } from "@/components/caution/caution-demo-hub";
import { getAuthContext } from "@/lib/auth-context";
import { loadWorkspace } from "@/lib/load-workspace";
import { stripeConnectFromWorkspace } from "@/lib/stripe-connect-status";

export default async function CautionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const { workspace } = await loadWorkspace();
  const connect = stripeConnectFromWorkspace(workspace);
  const defaultAmount = workspace?.caution_montant_defaut
    ? Number(workspace.caution_montant_defaut)
    : 2500;

  return (
    <CautionDemoHub
      workspaceName={auth.workspaceName}
      stripeReady={connect.ready}
      stripeIsDemo={connect.isDemo}
      defaultAmount={defaultAmount}
    />
  );
}
