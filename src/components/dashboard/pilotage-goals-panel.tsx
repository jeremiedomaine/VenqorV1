import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { YearDetail } from "@/lib/dashboard-stats";
import type { WorkspaceGoals } from "@/lib/workspace-setup";
import { cn, formatCurrencyCompact } from "@/lib/utils";

function GoalBar({
  label,
  current,
  target,
  formatValue,
}: {
  label: string;
  current: number;
  target: number;
  formatValue: (n: number) => string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-900">
          {formatValue(current)}{" "}
          <span className="text-slate-400">/ {formatValue(target)}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            pct >= 100 ? "bg-emerald-500" : "bg-[#4F46E5]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {pct >= 100
          ? "Objectif atteint"
          : `${pct} % de l'objectif · il reste ${formatValue(Math.max(0, target - current))}`}
      </p>
    </div>
  );
}

export function PilotageGoalsPanel({
  year,
  yearDetail,
  goals,
}: {
  year: number;
  yearDetail: YearDetail;
  goals: WorkspaceGoals;
}) {
  const hasDossiers =
    goals.objectif_dossiers_annuel != null &&
    goals.objectif_dossiers_annuel > 0;
  const hasCa =
    goals.objectif_ca_annuel != null && goals.objectif_ca_annuel > 0;

  if (!hasDossiers && !hasCa) return null;

  return (
    <section className="rounded-md border border-[#4F46E5]/20 bg-[#4F46E5]/5 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#4F46E5]" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Objectifs {year}
            </h3>
            <p className="text-xs text-slate-500">
              Définis dans les paramètres du domaine
            </p>
          </div>
        </div>
        <Link
          href="/parametres#objectifs"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:underline"
        >
          Modifier
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {hasDossiers && (
          <GoalBar
            label="Dossiers réalisés"
            current={yearDetail.booked.count}
            target={goals.objectif_dossiers_annuel!}
            formatValue={(n) => String(n)}
          />
        )}
        {hasCa && (
          <GoalBar
            label="Chiffre d'affaires"
            current={yearDetail.booked.revenue}
            target={goals.objectif_ca_annuel!}
            formatValue={(n) => formatCurrencyCompact(n)}
          />
        )}
      </div>
    </section>
  );
}
