import { formatDateRange } from "@/lib/portal-utils";
import { formatCurrency } from "@/lib/utils";
import type { PortalData } from "@/lib/types";

export function EventDetails({ event }: { event: PortalData["event"] }) {
  const dateRange = formatDateRange(event.date_debut, event.date_fin);
  const hasDetails =
    dateRange ||
    event.capacite_hebergement_totale > 0 ||
    event.prix_total > 0;

  if (!hasDetails) return null;

  const items = [
    dateRange && { label: "Dates", value: dateRange },
    event.capacite_hebergement_totale > 0 && {
      label: "Hébergement",
      value: `${event.capacite_hebergement_totale} personnes`,
    },
    event.prix_total > 0 && {
      label: "Forfait",
      value: formatCurrency(Number(event.prix_total)),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:p-10">
      <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
        Votre événement
      </p>
      <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {item.label}
            </dt>
            <dd className="mt-2 font-portal text-lg text-zinc-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
