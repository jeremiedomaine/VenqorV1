"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EventStatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Event } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function EventsList({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.nom_des_maries.toLowerCase().includes(q) ||
        e.notes_internes?.toLowerCase().includes(q),
    );
  }, [events, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un événement…"
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              {query
                ? "Aucun résultat pour cette recherche."
                : "Aucun dossier avec date bloquée ou confirmé pour le moment."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/evenements/${event.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-[#4F46E5]"
                    >
                      {event.nom_des_maries}
                    </Link>
                    <EventStatusBadge status={event.statut} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDate(event.date_debut)}
                    {event.date_fin && event.date_fin !== event.date_debut
                      ? ` → ${formatDate(event.date_fin)}`
                      : ""}
                  </p>
                  {event.prix_total > 0 && (
                    <p className="text-sm font-medium text-slate-700">
                      {formatCurrency(Number(event.prix_total))}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
