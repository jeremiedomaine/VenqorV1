"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Bell, CalendarDays, LayoutGrid } from "lucide-react";
import { ArchivesBoard } from "@/components/dashboard/archives-board";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { PaymentNotificationsBoard } from "@/components/dashboard/payment-notifications-board";
import { PipelineCalendar } from "@/components/dashboard/pipeline-calendar";
import { PipelineYearSelector } from "@/components/dashboard/pipeline-year-selector";
import { Button } from "@/components/ui/button";
import type { PendingPaymentNotification } from "@/lib/load-pending-payment-notifications";
import type { Event } from "@/lib/types";
import {
  ALL_YEARS_VALUE,
  buildYearOptionsFromEvents,
  filterEventsByYear,
  parseYearFilterParam,
  yearFilterLabel,
} from "@/lib/year-filter";
import { cn } from "@/lib/utils";

type PipelineViewMode = "kanban" | "calendar" | "archives" | "notifs";

function viewFromParam(param: string | null): PipelineViewMode {
  if (param === "calendrier") return "calendar";
  if (param === "archives") return "archives";
  if (param === "notifs") return "notifs";
  return "kanban";
}

export function PipelineViewFallback({
  events,
  archivedCount = 0,
}: {
  events: Event[];
  archivedCount?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1 opacity-60">
          <Button type="button" variant="ghost" size="sm" className="gap-2" disabled>
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-2" disabled>
            <CalendarDays className="h-4 w-4" />
            Calendrier
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled>
          <Archive className="h-4 w-4" />
          Voir les archivés{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </Button>
      </div>
      <KanbanBoard events={events} />
    </div>
  );
}

export function PipelineView({
  events,
  archivedEvents,
  archivedCount,
  paymentNotifications,
  notifCount,
}: {
  events: Event[];
  archivedEvents: Event[];
  archivedCount: number;
  paymentNotifications: PendingPaymentNotification[];
  notifCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = viewFromParam(searchParams.get("vue"));
  const yearFilter = parseYearFilterParam(searchParams.get("annee"));
  const availableYears = useMemo(
    () => buildYearOptionsFromEvents(events),
    [events],
  );
  const filteredEvents = useMemo(
    () => filterEventsByYear(events, yearFilter),
    [events, yearFilter],
  );
  const calendarFocusYear =
    yearFilter === ALL_YEARS_VALUE ? undefined : yearFilter;

  function setView(next: PipelineViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "calendar") params.set("vue", "calendrier");
    else if (next === "archives") params.set("vue", "archives");
    else if (next === "notifs") params.set("vue", "notifs");
    else params.delete("vue");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  const archivedCountDisplay = archivedCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2",
              view === "kanban" &&
                "bg-white text-slate-900 shadow-sm hover:bg-white",
            )}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2",
              view === "calendar" &&
                "bg-white text-slate-900 shadow-sm hover:bg-white",
            )}
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4" />
            Calendrier
          </Button>
          {notifCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "relative gap-2",
                view === "notifs" &&
                  "bg-white text-slate-900 shadow-sm hover:bg-white",
              )}
              onClick={() => setView("notifs")}
            >
              <Bell className="h-4 w-4" />
              Notifs
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[10px] font-semibold text-white">
                {notifCount}
              </span>
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant={view === "archives" ? "default" : "outline"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setView(view === "archives" ? "kanban" : "archives")}
        >
          <Archive className="h-4 w-4" />
          {view === "archives"
            ? "Retour au pipeline"
            : `Voir les archivés${archivedCountDisplay > 0 ? ` (${archivedCountDisplay})` : ""}`}
        </Button>
      </div>

      {(view === "kanban" || view === "calendar") && (
        <Suspense
          fallback={
            <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          <PipelineYearSelector
            years={availableYears}
            selectedFilter={yearFilter}
          />
        </Suspense>
      )}

      {yearFilter !== ALL_YEARS_VALUE && (view === "kanban" || view === "calendar") && (
        <p className="text-xs text-slate-500">
          {filteredEvents.length} dossier{filteredEvents.length !== 1 ? "s" : ""}{" "}
          en {yearFilterLabel(yearFilter).toLowerCase()}
          {filteredEvents.length === 0 && " — élargissez la période ou choisissez « Toutes »"}
        </p>
      )}

      {view === "kanban" && <KanbanBoard events={filteredEvents} />}
      {view === "calendar" && (
        <PipelineCalendar events={filteredEvents} focusYear={calendarFocusYear} />
      )}
      {view === "archives" && <ArchivesBoard events={archivedEvents} />}
      {view === "notifs" && (
        <PaymentNotificationsBoard notifications={paymentNotifications} />
      )}
    </div>
  );
}
