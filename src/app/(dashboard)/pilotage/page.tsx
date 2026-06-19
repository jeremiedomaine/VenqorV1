import { Suspense } from "react";
import { KpiPilotage } from "@/components/dashboard/kpi-pilotage";
import { PilotageYearSelector } from "@/components/dashboard/pilotage-year-selector";
import { loadDashboardStats } from "@/lib/load-dashboard-stats";
import { loadWorkspace } from "@/lib/load-workspace";
import { goalsFromWorkspace } from "@/lib/workspace-setup";

function parseYearParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value, 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) return undefined;
  return year;
}

export default async function PilotagePage({
  searchParams,
}: {
  searchParams: { annee?: string };
}) {
  const selectedYear = parseYearParam(searchParams.annee);
  const [{ stats }, { workspace }] = await Promise.all([
    loadDashboardStats(selectedYear),
    loadWorkspace(),
  ]);
  const goals = workspace ? goalsFromWorkspace(workspace) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Pilotage
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Vue annuelle de votre activité : CA confirmé, remplissage du
            calendrier, encaissements et projection sur les prochaines saisons
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          <PilotageYearSelector
            years={stats.availableYears}
            selectedYear={stats.selectedYear}
          />
        </Suspense>
      </div>

      <KpiPilotage stats={stats} goals={goals} />
    </div>
  );
}
