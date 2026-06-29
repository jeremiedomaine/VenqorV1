import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { DomainReadiness } from "@/lib/workspace-setup";
import { cn } from "@/lib/utils";

export function DomainReadinessBanner({
  readiness,
  emailFailureCount = 0,
}: {
  readiness: DomainReadiness;
  emailFailureCount?: number;
}) {
  if (readiness.isReadyForDossiers && emailFailureCount === 0) {
    return null;
  }

  const essentialPct = Math.round(
    (readiness.essentialCompleted / readiness.essentialTotal) * 100,
  );
  const missingEssential = readiness.essentialSteps.filter((s) => !s.done);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm",
        readiness.isReadyForDossiers
          ? "border-amber-200 bg-amber-50/80"
          : "border-[#4F46E5]/20 bg-[#4F46E5]/5",
      )}
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {readiness.isReadyForDossiers ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              ) : (
                <Sparkles className="h-5 w-5 shrink-0 text-[#4F46E5]" />
              )}
              <h2 className="text-base font-semibold text-slate-900">
                {readiness.isReadyForDossiers
                  ? "Attention sur vos emails"
                  : readiness.title}
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {readiness.isReadyForDossiers
                ? `${emailFailureCount} envoi${emailFailureCount > 1 ? "s" : ""} en échec cette semaine — vérifiez vos paramètres ou réessayez depuis le dossier.`
                : readiness.subtitle}
            </p>

            {!readiness.isReadyForDossiers && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Étapes essentielles</span>
                  <span>
                    {readiness.essentialCompleted}/{readiness.essentialTotal}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-[#4F46E5] transition-all duration-500"
                    style={{ width: `${essentialPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Link
            href={
              readiness.isReadyForDossiers
                ? "/parametres#emails"
                : "/parametres#apercu"
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            {readiness.isReadyForDossiers ? "Voir l'activité" : "Configurer"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!readiness.isReadyForDossiers && missingEssential.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {missingEssential.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-[#4F46E5]/30 hover:text-[#4F46E5]"
                >
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {readiness.isReadyForDossiers && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Domaine configuré — pensez à corriger les envois en échec.
          </p>
        )}
      </div>
    </section>
  );
}
