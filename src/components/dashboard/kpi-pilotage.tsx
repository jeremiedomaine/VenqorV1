import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CircleDollarSign,
  Heart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PilotageGoalsPanel } from "@/components/dashboard/pilotage-goals-panel";
import type { DashboardStats, YearDetail } from "@/lib/dashboard-stats";
import { EVENT_STATUS_LABELS } from "@/lib/types";
import type { WorkspaceGoals } from "@/lib/workspace-setup";
import { cn, formatCurrency, formatCurrencyCompact } from "@/lib/utils";

function DeltaBadge({
  value,
  suffix = "",
}: {
  value: number | null | undefined;
  suffix?: string;
}) {
  if (value === null || value === undefined) return null;
  if (value === 0) {
    return (
      <span className="text-xs font-medium text-slate-500">= vs {suffix}</span>
    );
  }
  const positive = value > 0;
  return (
    <span
      className={cn(
        "text-xs font-medium",
        positive ? "text-emerald-700" : "text-amber-700",
      )}
    >
      {positive ? "+" : ""}
      {value} % vs {suffix}
    </span>
  );
}

function MonthlyCalendar({ yearDetail }: { yearDetail: YearDetail }) {
  const maxCount = Math.max(
    1,
    ...yearDetail.monthly.map((m) => m.engagedCount),
  );

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Calendrier {yearDetail.year}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Répartition des événements par mois
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {EVENT_STATUS_LABELS.option}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {EVENT_STATUS_LABELS.confirme}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Clôturés
          </span>
        </div>
      </div>

      <div className="mt-6 grid h-32 grid-cols-12 items-end gap-1.5 sm:gap-2">
        {yearDetail.monthly.map((slot) => {
          const total = slot.engagedCount;
          const barHeight =
            total > 0 ? Math.max(16, (total / maxCount) * 100) : 4;

          return (
            <div
              key={slot.month}
              className="flex h-full flex-col items-center justify-end gap-1"
            >
              <div
                className="relative flex w-full flex-col justify-end overflow-hidden rounded-sm bg-slate-100"
                style={{ height: `${barHeight}%` }}
                title={
                  total > 0
                    ? `${slot.label} : ${slot.optionCount} ${slot.optionCount > 1 ? "dates bloquées" : "date bloquée"}, ${slot.confirmedActiveCount} confirmé${slot.confirmedActiveCount > 1 ? "s" : ""}, ${slot.closedCount} clôturé${slot.closedCount > 1 ? "s" : ""}`
                    : `${slot.label} : aucun événement`
                }
              >
                {total > 0 && (
                  <div className="flex h-full w-full flex-col justify-end">
                    {slot.optionCount > 0 && (
                      <div
                        className="w-full bg-amber-400"
                        style={{
                          height: `${(slot.optionCount / total) * 100}%`,
                        }}
                      />
                    )}
                    {slot.confirmedActiveCount > 0 && (
                      <div
                        className="w-full bg-emerald-500"
                        style={{
                          height: `${(slot.confirmedActiveCount / total) * 100}%`,
                        }}
                      />
                    )}
                    {slot.closedCount > 0 && (
                      <div
                        className="w-full bg-blue-500"
                        style={{
                          height: `${(slot.closedCount / total) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                {slot.label}
              </span>
              {slot.engagedRevenue > 0 && (
                <span className="text-[9px] font-semibold tabular-nums text-slate-700 sm:text-[10px]">
                  {formatCurrencyCompact(slot.engagedRevenue)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearPipelineBreakdown({ yearDetail }: { yearDetail: YearDetail }) {
  const rows = [
    {
      label: "Clôturés",
      count: yearDetail.closed.count,
      value: yearDetail.closed.revenue,
      color: "bg-blue-500",
    },
    {
      label: "Confirmés en cours",
      count: yearDetail.confirmedActive.count,
      value: yearDetail.confirmedActive.revenue,
      color: "bg-emerald-500",
    },
    {
      label: EVENT_STATUS_LABELS.option,
      count: yearDetail.option.count,
      value: yearDetail.option.revenue,
      color: "bg-amber-400",
    },
    {
      label: "Demandes datées",
      count: yearDetail.prospect.count,
      value: yearDetail.prospect.revenue,
      color: "bg-slate-300",
    },
  ];
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Activité {yearDetail.year}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Dossiers avec une date en {yearDetail.year}
      </p>

      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Aucun dossier daté pour cette année. Les demandes sans date
          n&apos;apparaissent pas ici.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {rows.map(
              (row) =>
                row.count > 0 && (
                  <div
                    key={row.label}
                    className={cn("h-full", row.color)}
                    style={{ width: `${(row.count / total) * 100}%` }}
                  />
                ),
            )}
          </div>
          <div className="mt-4 space-y-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", row.color)} />
                  <span className="text-sm text-slate-700">{row.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {row.count}
                  </span>
                  {row.value > 0 && (
                    <span className="ml-2 text-sm text-slate-500">
                      · {formatCurrencyCompact(row.value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {yearDetail.booked.count > 0 && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              CA confirmé + clôturés :{" "}
              <span className="font-semibold">
                {formatCurrencyCompact(yearDetail.booked.revenue)}
              </span>{" "}
              ({yearDetail.booked.count} dossier
              {yearDetail.booked.count > 1 ? "s" : ""}
              {yearDetail.closed.count > 0 &&
                ` · dont ${yearDetail.closed.count} clôturé${yearDetail.closed.count > 1 ? "s" : ""}`}
              )
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MultiYearProjection({
  projections,
}: {
  projections: DashboardStats["projections"];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">
          Projection pluriannuelle
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          CA confirmé et pipeline par année — pour anticiper le remplissage
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs text-slate-500">
              <th className="px-5 py-2.5 font-medium">Année</th>
              <th className="px-5 py-2.5 font-medium text-right">Réalisé</th>
              <th className="px-5 py-2.5 font-medium text-right">CA réalisé</th>
              <th className="px-5 py-2.5 font-medium text-right">Clôturés</th>
              <th className="px-5 py-2.5 font-medium text-right">
                {EVENT_STATUS_LABELS.option}
              </th>
              <th className="px-5 py-2.5 font-medium text-right">Demandes</th>
              <th className="px-5 py-2.5 font-medium text-right">Encaissé</th>
              <th className="px-5 py-2.5 font-medium text-right">Reste</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((row) => (
              <tr
                key={row.year}
                className={cn(
                  "border-b border-slate-50",
                  row.isCurrent && "bg-[#4F46E5]/5",
                )}
              >
                <td className="px-5 py-3">
                  <span className="font-medium text-slate-900">{row.year}</span>
                  {row.isCurrent && (
                    <span className="ml-2 rounded-full bg-[#4F46E5]/10 px-2 py-0.5 text-xs font-medium text-[#4F46E5]">
                      En cours
                    </span>
                  )}
                  {row.isFuture && !row.isCurrent && (
                    <span className="ml-2 text-xs text-slate-400">À venir</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-900">
                  {row.bookedCount || "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                  {row.bookedRevenue > 0
                    ? formatCurrency(row.bookedRevenue)
                    : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-blue-700">
                  {row.closedCount > 0
                    ? `${row.closedCount} · ${formatCurrencyCompact(row.closedRevenue)}`
                    : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {row.engagedCount > 0
                    ? `${row.engagedCount} · ${formatCurrencyCompact(row.engagedRevenue)}`
                    : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {row.prospectCount || "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-emerald-700">
                  {row.collected > 0
                    ? formatCurrencyCompact(row.collected)
                    : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-amber-700">
                  {row.pending > 0
                    ? formatCurrencyCompact(row.pending)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GlobalPipelineSnapshot({ stats }: { stats: DashboardStats }) {
  const totalActive =
    stats.byStatus.prospect + stats.byStatus.option + stats.byStatus.confirme;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Pipeline global (aujourd&apos;hui)
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Tous dossiers actifs, toutes années confondues
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {(
          [
            { key: "prospect", count: stats.byStatus.prospect },
            { key: "option", count: stats.byStatus.option },
            { key: "confirme", count: stats.byStatus.confirme },
          ] as const
        ).map(({ key, count }) => (
          <div
            key={key}
            className="rounded-md bg-slate-50 px-3 py-2.5 text-center"
          >
            <p className="text-xl font-semibold text-slate-900">{count}</p>
            <p className="text-xs text-slate-500">
              {EVENT_STATUS_LABELS[key]}
            </p>
          </div>
        ))}
        <div className="rounded-md bg-blue-50 px-3 py-2.5 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {stats.closedCount}
          </p>
          <p className="text-xs text-slate-500">Clôturés</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
        <div>
          <span className="text-slate-500">Engagé total · </span>
          <span className="font-medium text-slate-900">
            {formatCurrencyCompact(stats.signed.value)}
          </span>
          <span className="text-slate-500">
            {" "}
            ({stats.signed.count} dossiers)
          </span>
        </div>
        <div>
          <span className="text-slate-500">Encaissement · </span>
          <span className="font-medium text-emerald-700">
            {stats.collections.rate} %
          </span>
          <span className="text-slate-500">
            {" "}
            ({formatCurrencyCompact(stats.collections.paid)} /{" "}
            {formatCurrencyCompact(
              stats.collections.paid + stats.collections.pending,
            )}
            )
          </span>
        </div>
      </div>
      {totalActive === 0 && stats.closedCount === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Aucun dossier actif — commencez par ajouter une demande.
        </p>
      )}
    </div>
  );
}

export function KpiPilotage({
  stats,
  goals,
}: {
  stats: DashboardStats;
  goals?: WorkspaceGoals | null;
}) {
  const { yearDetail } = stats;
  const prevYear = stats.selectedYear - 1;

  return (
    <div className="space-y-8">
      {goals && (
        <PilotageGoalsPanel
          year={stats.selectedYear}
          yearDetail={yearDetail}
          goals={goals}
        />
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Vue annuelle {stats.selectedYear}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Chiffres basés sur la date d&apos;événement — ce que vous allez
            accueillir et encaisser cette année
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={`CA ${stats.selectedYear}`}
            value={formatCurrencyCompact(yearDetail.booked.revenue)}
            sub={
              yearDetail.booked.count > 0
                ? `${yearDetail.booked.count} dossier${yearDetail.booked.count > 1 ? "s" : ""} · ${yearDetail.closed.count} clôturé${yearDetail.closed.count > 1 ? "s" : ""} · ${yearDetail.confirmedActive.count} en cours`
                : "Aucun dossier confirmé ou clôturé cette année"
            }
            icon={Heart}
            accent="emerald"
          />
          <KpiCard
            label={EVENT_STATUS_LABELS.option}
            value={String(yearDetail.engaged.count)}
            sub={
              yearDetail.engaged.revenue > 0
                ? `${formatCurrencyCompact(yearDetail.engaged.revenue)} — date bloquée, confirmés et clôturés`
                : "Aucun dossier engagé cette année"
            }
            icon={CalendarRange}
            accent="amber"
          />
          <KpiCard
            label={`Encaissé sur ${stats.selectedYear}`}
            value={formatCurrencyCompact(yearDetail.collections.paid)}
            sub={`${yearDetail.collections.rate} % des échéances signées`}
            icon={Wallet}
            accent="indigo"
          />
          <KpiCard
            label={`Reste à encaisser ${stats.selectedYear}`}
            value={formatCurrencyCompact(yearDetail.collections.pending)}
            sub="Sur dossiers engagés (date bloquée et au-delà)"
            icon={CircleDollarSign}
            accent={
              yearDetail.collections.pending > 0 ? "amber" : "slate"
            }
          />
        </div>

        {yearDetail.vsPreviousYear && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-700">vs {prevYear} :</span>
            <span className="text-slate-600">
              CA réalisé{" "}
              <DeltaBadge
                value={yearDetail.vsPreviousYear.revenuePct}
                suffix={String(prevYear)}
              />
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">
              {yearDetail.booked.count} dossier
              {yearDetail.booked.count > 1 ? "s" : ""}{" "}
              <DeltaBadge
                value={yearDetail.vsPreviousYear.countPct}
                suffix={String(prevYear)}
              />
            </span>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MonthlyCalendar yearDetail={yearDetail} />
        <YearPipelineBreakdown yearDetail={yearDetail} />
      </section>

      <section>
        <MultiYearProjection projections={stats.projections} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Suivi opérationnel
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            État du pipeline et trésorerie globale, indépendamment de
            l&apos;année sélectionnée
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlobalPipelineSnapshot stats={stats} />
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Trésorerie dossiers signés
            </p>
            <p className="mt-3 text-4xl font-semibold tabular-nums text-slate-900">
              {stats.collections.rate}
              <span className="text-xl text-slate-400">%</span>
            </p>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${stats.collections.rate}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-sm text-slate-600">
              <span>
                {formatCurrencyCompact(stats.collections.paid)} perçus
              </span>
              <span>
                {formatCurrencyCompact(stats.collections.pending)} restants
              </span>
            </div>
            {stats.overdue.count > 0 && (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {formatCurrencyCompact(stats.overdue.amount)} en retard (
                {stats.overdue.count} paiement
                {stats.overdue.count > 1 ? "s" : ""})
              </p>
            )}
            {stats.nextWedding && (
              <Link
                href={`/evenements/${stats.nextWedding.id}`}
                className="mt-4 flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm transition-colors hover:bg-slate-100"
              >
                <TrendingUp className="h-4 w-4 text-[#4F46E5]" />
                <span className="min-w-0 flex-1 truncate text-slate-700">
                  Prochain événement :{" "}
                  <span className="font-medium text-slate-900">
                    {stats.nextWedding.nom}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {stats.alerts.length > 0 && (
        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Points d&apos;attention
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      alert.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-[#4F46E5]",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {alert.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {alert.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
