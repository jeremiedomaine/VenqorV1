"use client";

import { NEUTRAL_COPY } from "@/lib/event-copy";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dayCellHighlight,
  eventsOnDate,
  getCalendarEventStyle,
  isActiveBlockingEvent,
  isEventClosed,
  sortEventsForCalendarDay,
} from "@/lib/calendar-events";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function calendarYearBounds(events: Event[]) {
  const fromEvents = events
    .map((e) => (e.date_debut ? new Date(e.date_debut).getFullYear() : null))
    .filter((y): y is number => y !== null);
  const current = new Date().getFullYear();
  const min =
    fromEvents.length > 0 ? Math.min(current - 1, ...fromEvents) : current - 1;
  const max =
    fromEvents.length > 0 ? Math.max(current + 4, ...fromEvents) : current + 4;
  const years: number[] = [];
  for (let y = min; y <= max; y++) years.push(y);
  return years;
}

function CalendarMonthPicker({
  value,
  years,
  onChange,
}: {
  value: Date;
  years: number[];
  onChange: (month: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(value.getFullYear());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setPickerYear(value.getFullYear());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        index,
        label: format(new Date(pickerYear, index, 1), "MMM", { locale: fr }),
      })),
    [pickerYear],
  );

  const yearIndex = years.indexOf(pickerYear);

  function selectMonth(monthIndex: number) {
    onChange(startOfMonth(new Date(pickerYear, monthIndex, 1)));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex min-w-[10rem] items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold capitalize text-slate-900 transition-colors hover:bg-slate-100",
          open && "bg-slate-100",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choisir un mois et une année"
      >
        {format(value, "MMMM yyyy", { locale: fr })}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Sélection du mois"
          className="absolute left-1/2 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 px-0"
              disabled={yearIndex <= 0}
              onClick={() => setPickerYear((y) => years[yearIndex - 1] ?? y)}
              aria-label="Année précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums text-slate-900">
              {pickerYear}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 px-0"
              disabled={yearIndex < 0 || yearIndex >= years.length - 1}
              onClick={() => setPickerYear((y) => years[yearIndex + 1] ?? y)}
              aria-label="Année suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {months.map((month) => {
              const isSelected =
                value.getFullYear() === pickerYear &&
                value.getMonth() === month.index;

              return (
                <button
                  key={month.index}
                  type="button"
                  onClick={() => selectMonth(month.index)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm capitalize transition-colors",
                    isSelected
                      ? "bg-[#4F46E5] font-medium text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const MAX_PROSPECTS_VISIBLE = 3;

function CalendarEventChip({ event }: { event: Event }) {
  return (
    <Link
      href={`/evenements/${event.id}`}
      className={cn(
        "block truncate rounded border px-1.5 py-0.5 transition-opacity hover:opacity-80",
        getCalendarEventStyle(event),
      )}
      title={event.nom_evenement || event.nom_des_maries}
    >
      {event.nom_evenement || event.nom_des_maries}
    </Link>
  );
}

export function PipelineCalendar({ events }: { events: Event[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const availableYears = useMemo(() => calendarYearBounds(events), [events]);

  const datedEvents = useMemo(
    () => events.filter((event) => event.date_debut),
    [events],
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CalendarMonthPicker
            value={currentMonth}
            years={availableYears}
            onChange={setCurrentMonth}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Aujourd&apos;hui
          </Button>
        </div>

        <CalendarLegend />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-medium text-slate-500"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = sortEventsForCalendarDay(
              eventsOnDate(datedEvents, dateKey),
            );
            const activeBlockingEvents = dayEvents.filter((e) =>
              isActiveBlockingEvent(e),
            );
            const closedEvents = dayEvents.filter((e) => isEventClosed(e));
            const prospectEvents = dayEvents.filter(
              (e) => e.statut === "prospect",
            );
            const visibleProspects = prospectEvents.slice(0, MAX_PROSPECTS_VISIBLE);
            const hiddenProspectCount =
              prospectEvents.length - visibleProspects.length;

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[7.5rem] border-b border-r border-slate-100 p-1.5 sm:min-h-[8.5rem]",
                  !isSameMonth(day, currentMonth) && "bg-slate-50/60",
                  dayCellHighlight(dayEvents),
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) && "bg-[#4F46E5] text-white",
                      !isToday(day) &&
                        isSameMonth(day, currentMonth) &&
                        "text-slate-700",
                      !isSameMonth(day, currentMonth) && "text-slate-400",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {activeBlockingEvents.length > 0 && (
                    <span
                      className="hidden text-[10px] font-medium text-slate-500 sm:inline"
                      title="Date bloquée"
                    >
                      Bloquée
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {activeBlockingEvents.map((event) => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                  {closedEvents.map((event) => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                  {visibleProspects.map((event) => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                  {hiddenProspectCount > 0 && (
                    <p className="px-1 text-[10px] text-slate-400">
                      {NEUTRAL_COPY.calendarOverflow(hiddenProspectCount)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {datedEvents.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          Aucun événement avec une date renseignée.
        </p>
      )}
    </div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-slate-200 bg-slate-100" />
        {NEUTRAL_COPY.calendarLegend}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-amber-400 bg-amber-200" />
        Date bloquée
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-emerald-400 bg-emerald-200" />
        Confirmés (date bloquée)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-blue-400 bg-blue-200" />
        Clôturés (suivi terminé)
      </span>
    </div>
  );
}
