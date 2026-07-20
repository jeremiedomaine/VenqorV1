import { CautionStripeSettings } from "@/components/caution/caution-stripe-settings";
import { loadWorkspace } from "@/lib/load-workspace";

export default async function CautionParametresPage() {
  const { workspace } = await loadWorkspace();
  const defaultAmount = workspace?.caution_montant_defaut
    ? Number(workspace.caution_montant_defaut)
    : 500;

  return <CautionStripeSettings defaultAmount={defaultAmount} />;
}
