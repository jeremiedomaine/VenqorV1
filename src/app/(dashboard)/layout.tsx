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
  const workspaceName = auth?.workspaceName ?? "Mon domaine";
  const { workspace } = await loadWorkspace();
  const needsOnboarding = !workspace?.iban?.trim();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <DashboardSidebar workspaceName={workspaceName} />
      <main className="min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      {needsOnboarding && workspace && (
        <OnboardingModal initialDomainName={workspace.nom_domaine} />
      )}
    </div>
  );
}
