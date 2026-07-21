import { redirect } from "next/navigation";
import { CautionDemoHub } from "@/components/caution/caution-demo-hub";
import { getAuthContext } from "@/lib/auth-context";
import { loadWorkspace } from "@/lib/load-workspace";

export default async function CautionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const { workspace } = await loadWorkspace();
  const defaultAmount = workspace?.caution_montant_defaut
    ? Number(workspace.caution_montant_defaut)
    : 500;

  return (
    <CautionDemoHub
      workspaceName={auth.workspaceName}
      defaultAmount={defaultAmount}
      autoJoursAvant={workspace?.caution_auto_jours_avant ?? 7}
      autoActive={workspace?.caution_auto_active ?? true}
    />
  );
}
