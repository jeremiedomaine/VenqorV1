"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search } from "lucide-react";
import {
  KanbanColumnPicker,
  useVisibleKanbanColumns,
} from "@/components/dashboard/kanban-column-picker";
import { EventStatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isEventClosed } from "@/lib/calendar-events";
import { eventMatchesKanbanColumn } from "@/lib/kanban-columns";
import {
  KANBAN_BOARD_COLUMN_HINTS,
  KANBAN_BOARD_COLUMNS,
  KANBAN_COLUMN_LABELS,
  type Event,
  type KanbanColumnId,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function EventCardContent({ event }: { event: Event }) {
  const closed = isEventClosed(event);

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Link
        href={`/evenements/${event.id}`}
        className="block font-medium text-slate-900 hover:text-[#4F46E5]"
      >
        {event.nom_evenement || event.nom_des_maries}
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {event.date_debut && <span>{formatDate(event.date_debut)}</span>}
        {event.prix_total > 0 && (
          <span className="font-medium text-slate-600">
            {formatCurrency(Number(event.prix_total))}
          </span>
        )}
      </div>
      {event.notes_internes && (
        <p className="line-clamp-2 text-xs italic text-slate-400">
          {event.notes_internes}
        </p>
      )}
      {closed ? (
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          Clôturé
        </span>
      ) : (
        <EventStatusBadge status={event.statut} />
      )}
    </div>
  );
}

function KanbanCard({
  event,
  lightBlue,
}: {
  event: Event;
  lightBlue?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border shadow-sm transition-shadow hover:shadow-md",
        lightBlue
          ? "border-blue-200/80 bg-blue-50"
          : "border-slate-200 bg-white",
      )}
    >
      <CardContent className="p-4">
        <EventCardContent event={event} />
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  columnId,
  label,
  hint,
  items,
}: {
  columnId: KanbanColumnId;
  label: string;
  hint: string;
  items: Event[];
}) {
  const isClosedColumn = columnId === "cloture";

  return (
    <div className="flex min-h-[320px] flex-col space-y-3">
      <div className="px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {items.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      </div>
      <div className="flex-1 space-y-3 rounded-lg border border-dashed border-slate-200 p-2">
        {items.map((event) => (
          <KanbanCard
            key={event.id}
            event={event}
            lightBlue={isClosedColumn}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            {isClosedColumn
              ? "Aucun dossier clôturé"
              : "Aucun dossier — avancez-les depuis leur fiche"}
          </div>
        )}
      </div>
    </div>
  );
}

const GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1 max-w-md",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

export function KanbanBoard({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useVisibleKanbanColumns();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.nom_des_maries.toLowerCase().includes(q) ||
        e.notes_internes?.toLowerCase().includes(q),
    );
  }, [events, query]);

  const hasSearch = query.trim().length > 0;

  const columns = KANBAN_BOARD_COLUMNS.filter((id) =>
    visibleColumns.includes(id),
  )
    .map((columnId) => ({
      columnId,
      label: KANBAN_COLUMN_LABELS[columnId],
      hint: KANBAN_BOARD_COLUMN_HINTS[columnId],
      items: filtered.filter((e) => eventMatchesKanbanColumn(e, columnId)),
    }))
    .filter((col) => !hasSearch || col.items.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Ouvrez une fiche dossier pour faire avancer les étapes (bloquer la date,
        acompte, clôture).
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un couple, une note…"
            className="pl-9"
          />
        </div>
        <KanbanColumnPicker
          visibleColumns={visibleColumns}
          onChange={setVisibleColumns}
        />
      </div>

      {hasSearch && (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <LayoutGrid className="h-3.5 w-3.5" />
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} — colonnes
          vides masquées
        </p>
      )}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Aucun événement ne correspond à votre recherche.
        </p>
      )}

      {filtered.length > 0 && columns.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            GRID_COLS[columns.length] ?? "md:grid-cols-2 xl:grid-cols-4",
          )}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.columnId}
              columnId={column.columnId}
              label={column.label}
              hint={column.hint}
              items={column.items}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && columns.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Aucune colonne visible — sélectionnez au moins une colonne.
        </p>
      )}
    </div>
  );
}
