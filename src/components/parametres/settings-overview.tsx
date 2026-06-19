import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Target,
} from "lucide-react";
import type { WorkspaceSetupStatus } from "@/lib/workspace-setup";
import { billingFromWorkspace } from "@/lib/billing";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettingsOverview({
  workspace,
  setup,
}: {
  workspace: Workspace;
  setup: WorkspaceSetupStatus;
}) {
  const billing = billingFromWorkspace(workspace);
  const progressPct = Math.round(
    (setup.completedCount / setup.totalCount) * 100,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {workspace.nom_domaine}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Facturation {billing.facturation_acompte_pct} % /{" "}
            {billing.facturation_solde_pct} %
          </p>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Configuration du domaine
            </span>
            <span className="text-slate-500">
              {setup.completedCount}/{setup.totalCount} étapes
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {setup.steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/80"
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-slate-900" : "text-slate-700",
                  )}
                >
                  {step.label}
                </p>
                <p className="truncate text-xs text-slate-500">{step.detail}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>

      {setup.completedCount < setup.totalCount && (
        <div className="border-t border-slate-100 bg-[#4F46E5]/5 px-6 py-3">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Target className="h-4 w-4 shrink-0 text-[#4F46E5]" />
            Complétez votre configuration pour tirer le meilleur parti du
            pilotage.
          </p>
        </div>
      )}
    </section>
  );
}
