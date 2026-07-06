import { redirect } from "next/navigation";
import { CautionShell } from "@/components/caution/caution-shell";
import { getAuthContext } from "@/lib/auth-context";
import { loadWorkspace } from "@/lib/load-workspace";
import { getProductMode } from "@/lib/workspace-capabilities";

export default async function CautionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const { workspace } = await loadWorkspace();
  const productMode = getProductMode(workspace);

  return (
    <CautionShell workspaceName={auth.workspaceName}>
      {productMode === "full" && (
        <div className="mb-6 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
          Aperçu démo du module Caution — accessible depuis votre compte Venqor
          complet. Le client « caution only » verra uniquement cet espace.
        </div>
      )}
      {children}
    </CautionShell>
  );
}
