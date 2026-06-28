import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarHeart,
  CircleDollarSign,
  Users,
} from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { NEUTRAL_COPY } from "@/lib/event-copy";
import { cn, formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";

function KpiTile({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  href,
  valueTitle,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  accent: "indigo" | "amber" | "emerald" | "slate";
  href?: string;
  valueTitle?: string;
}) {
  const accents = {
    indigo: "bg-[#4F46E5]/10 text-[#4F46E5]",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  const inner = (
    <div className="flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accents[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p
          className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900"
          title={valueTitle}
        >
          {value}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-600">{detail}</p>
      </div>
      {href && (
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function KpiOverview({ stats }: { stats: DashboardStats }) {
  const infoAlert = stats.alerts.find((a) => a.id !== "overdue");

  const encaissementDetail =
    stats.overdue.count > 0
      ? `Dont ${formatCurrencyCompact(stats.overdue.amount)} en retard (${stats.overdue.count} paiement${stats.overdue.count > 1 ? "s" : ""})`
      : `${formatCurrencyCompact(stats.collections.paid)} déjà perçus`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">Aperçu rapide</p>
        <Link
          href="/pilotage"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[#4F46E5] hover:bg-[#4F46E5]/5"
        >
          <BarChart3 className="h-4 w-4" />
          Pilotage annuel
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <KpiTile
          label="À encaisser"
          value={formatCurrencyCompact(stats.collections.pending)}
          valueTitle={formatCurrency(stats.collections.pending)}
          detail={encaissementDetail}
          icon={CircleDollarSign}
          accent={stats.overdue.count > 0 ? "amber" : "slate"}
          href="/pilotage"
        />
        <KpiTile
          label="Prochain événement"
          value={
            stats.nextWedding
              ? stats.nextWedding.daysUntil === 0
                ? "Aujourd'hui"
                : stats.nextWedding.daysUntil === 1
                  ? "Demain"
                  : `J-${stats.nextWedding.daysUntil}`
              : "—"
          }
          detail={
            stats.nextWedding
              ? `${stats.nextWedding.nom} · ${formatDate(stats.nextWedding.date)}`
              : "Aucun événement confirmé à venir"
          }
          icon={CalendarHeart}
          accent="indigo"
          href={stats.nextWedding ? `/evenements/${stats.nextWedding.id}` : undefined}
        />
        <KpiTile
          label={`CA ${stats.selectedYear}`}
          value={formatCurrencyCompact(stats.yearDetail.booked.revenue)}
          valueTitle={formatCurrency(stats.yearDetail.booked.revenue)}
          detail={
            stats.yearDetail.booked.count > 0
              ? `${stats.yearDetail.booked.count} dossier${stats.yearDetail.booked.count > 1 ? "s" : ""} · dont ${stats.yearDetail.closed.count} clôturé${stats.yearDetail.closed.count > 1 ? "s" : ""}`
              : NEUTRAL_COPY.demandesEnCours(stats.pipeline.count)
          }
          icon={Users}
          accent="emerald"
          href="/pilotage"
        />
      </div>

      {infoAlert && (
        <Link
          href={infoAlert.href}
          className="flex items-center gap-3 rounded-lg border border-[#4F46E5]/20 bg-[#4F46E5]/5 px-4 py-3 text-sm transition-colors hover:bg-[#4F46E5]/10"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#4F46E5]" />
          <span className="min-w-0 flex-1">
            <span className="font-medium text-slate-900">{infoAlert.title}</span>
            <span className="text-slate-600"> — {infoAlert.description}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      )}
    </section>
  );
}
