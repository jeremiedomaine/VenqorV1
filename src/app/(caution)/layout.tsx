import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
        <Link
          href="/"
          className="mb-6 flex items-center gap-3 rounded-lg border border-[#4F46E5]/20 bg-[#4F46E5]/5 px-4 py-3 text-sm transition-colors hover:bg-[#4F46E5]/10"
        >
          <span className="min-w-0 flex-1 text-slate-600">
            <span className="font-medium text-slate-900">
              Aperçu module Caution / ÉDL
            </span>
            {" — "}
            Espace dédié (ex. Ferme de la Loge). Retour au tableau de bord
            Venqor complet.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      )}
      {children}
    </CautionShell>
  );
}
