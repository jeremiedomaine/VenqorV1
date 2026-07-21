import { CautionStripeSettings } from "@/components/caution/caution-stripe-settings";
import { loadWorkspace } from "@/lib/load-workspace";

export default async function CautionParametresPage() {
  const { workspace } = await loadWorkspace();
  const defaultAmount = workspace?.caution_montant_defaut
    ? Number(workspace.caution_montant_defaut)
    : 500;

  return (
    <CautionStripeSettings
      defaultAmount={defaultAmount}
      autoActive={workspace?.caution_auto_active ?? true}
      autoJoursAvant={workspace?.caution_auto_jours_avant ?? 7}
      relanceActive={workspace?.caution_relance_active ?? true}
      relanceJoursAvant={workspace?.caution_relance_jours_avant ?? 3}
    />
  );
}
