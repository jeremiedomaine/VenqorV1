"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Search } from "lucide-react";
import { restoreEvent } from "@/actions/events";
import { FormFeedback } from "@/components/ui/form-feedback";
import { EventStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EVENT_STATUS_LABELS, type Event } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ArchivesBoard({ events }: { events: Event[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    error?: string;
    success?: string;
  }>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.nom_des_maries.toLowerCase().includes(q) ||
        e.nom_evenement?.toLowerCase().includes(q) ||
        e.notes_internes?.toLowerCase().includes(q),
    );
  }, [events, query]);

  function handleRestore(eventId: string) {
    setFeedback({});
    startTransition(async () => {
      const result = await restoreEvent(eventId);
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      setFeedback({ success: "Dossier restauré dans le pipeline." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <FormFeedback
        error={feedback.error}
        success={feedback.success}
        onDismiss={() => setFeedback({})}
      />

      <p className="text-sm text-slate-600">
        Dossiers retirés du pipeline actif. Restaurez-les pour reprendre le suivi
        ou consultez la fiche en lecture seule.
      </p>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un dossier archivé…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            {query
              ? "Aucun résultat pour cette recherche."
              : "Aucun dossier archivé pour le moment."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((event) => (
            <Card key={event.id} className="border-slate-200">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/evenements/${event.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-[#4F46E5]"
                    >
                      {event.nom_evenement || event.nom_des_maries}
                    </Link>
                    <EventStatusBadge status={event.statut} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {event.date_debut
                      ? formatDate(event.date_debut)
                      : "Sans date"}
                    {event.prix_total > 0 &&
                      ` · ${formatCurrency(Number(event.prix_total))}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    Archivé le{" "}
                    {event.archived_at
                      ? formatDate(event.archived_at.slice(0, 10))
                      : "—"}{" "}
                    ·{" "}
                    {EVENT_STATUS_LABELS[event.statut]} au moment de
                    l&apos;archivage
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  disabled={pending}
                  onClick={() => handleRestore(event.id)}
                >
                  <ArchiveRestore className="h-4 w-4" />
                  Restaurer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
