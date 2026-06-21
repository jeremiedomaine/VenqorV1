import { redirect } from "next/navigation";
import { AdminImpersonationBanner } from "@/components/admin/admin-impersonation-banner";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { NavigationProgress } from "@/components/dashboard/navigation-progress";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { getAuthContext } from "@/lib/auth-context";
import { loadWorkspace } from "@/lib/load-workspace";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth?.isVenqorAdmin && !auth.isImpersonating) {
    redirect("/admin");
  }

  const workspaceName = auth?.workspaceName ?? "Mon domaine";
  const { workspace } = await loadWorkspace();
  const needsOnboarding =
    auth &&
    !auth.isVenqorAdmin &&
    workspace &&
    !workspace.iban?.trim();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <DashboardSidebar workspaceName={workspaceName} />
      <main className="min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {auth?.isImpersonating && (
            <AdminImpersonationBanner workspaceName={workspaceName} />
          )}
          {children}
        </div>
      </main>
      {needsOnboarding && (
        <OnboardingModal
          workspaceId={workspace.id}
          initialDomainName={workspace.nom_domaine}
        />
      )}
    </div>
  );
}
