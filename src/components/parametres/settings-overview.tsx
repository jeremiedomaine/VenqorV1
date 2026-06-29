"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Mail,
  Target,
  XCircle,
} from "lucide-react";
import {
  EMAIL_CATEGORY_LABELS,
  type EmailCategory,
} from "@/lib/email/email-categories";
import type { EmailLogRow } from "@/lib/email/log-email-delivery";
import type { DomainReadiness } from "@/lib/workspace-setup";
import { billingFromWorkspace } from "@/lib/billing";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatLogDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SettingsOverview({
  workspace,
  readiness,
}: {
  workspace: Workspace;
  readiness: DomainReadiness;
}) {
  const billing = billingFromWorkspace(workspace);
  const essentialPct = Math.round(
    (readiness.essentialCompleted / readiness.essentialTotal) * 100,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {workspace.nom_domaine}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {readiness.isReadyForDossiers ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Prêt pour vos dossiers
              </span>
            ) : (
              readiness.subtitle
            )}
          </p>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {readiness.title}
            </span>
            <span className="text-slate-500">
              {readiness.essentialCompleted}/{readiness.essentialTotal}{" "}
              essentielles
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                readiness.isReadyForDossiers ? "bg-emerald-500" : "bg-[#4F46E5]",
              )}
              style={{ width: `${essentialPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Échéancier type : {billing.facturation_acompte_pct} % /{" "}
            {billing.facturation_solde_pct} %
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {readiness.steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/80"
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    step.essential ? "text-amber-400" : "text-slate-300",
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-slate-900" : "text-slate-700",
                  )}
                >
                  {step.label}
                  {!step.essential && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      optionnel
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">{step.detail}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>

      {!readiness.isReadyForDossiers && (
        <div className="border-t border-slate-100 bg-[#4F46E5]/5 px-6 py-3">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Target className="h-4 w-4 shrink-0 text-[#4F46E5]" />
            Une fois les étapes essentielles complétées, vous pourrez engager
            vos dossiers sereinement.
          </p>
        </div>
      )}
    </section>
  );
}

export function EmailActivityPanel({ logs }: { logs: EmailLogRow[] }) {
  return (
    <section id="emails" className="scroll-mt-24 lg:scroll-mt-8">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Mail className="h-5 w-5 text-[#4F46E5]" />
          Activité emails
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Derniers envois automatiques (acomptes, soldes, relances,
          notifications). Chaque email est retenté jusqu&apos;à 3 fois en cas
          d&apos;échec.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-500">
          Aucun email enregistré pour l&apos;instant.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {log.status === "sent" && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  {log.status === "skipped" && (
                    <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  {log.status === "failed" && (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="truncate">
                    {EMAIL_CATEGORY_LABELS[log.category as EmailCategory] ??
                      log.category}
                  </span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  {log.recipient} · {log.subject}
                </p>
                {log.status === "failed" && log.error_message && (
                  <p className="mt-1 text-xs text-red-600">{log.error_message}</p>
                )}
              </div>
              <p className="shrink-0 text-xs text-slate-400">
                {formatLogDate(log.created_at)}
                {log.attempt_count > 1 ? ` · ${log.attempt_count} essais` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
