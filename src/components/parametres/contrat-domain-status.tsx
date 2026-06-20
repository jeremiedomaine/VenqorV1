import { FileCheck, FileClock } from "lucide-react";
import type { ContratReadiness } from "@/lib/contrat-status";

export function ContratDomainStatus({ status }: { status: ContratReadiness }) {
  const Icon = status.ready ? FileCheck : FileClock;

  return (
    <div
      className={`rounded-lg border p-5 ${
        status.ready
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            status.ready ? "text-emerald-600" : "text-slate-500"
          }`}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">{status.label}</p>
          <p className="text-sm text-slate-600">{status.detail}</p>
        </div>
      </div>
    </div>
  );
}
