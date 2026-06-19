import { eachDayOfInterval, format, isValid, parseISO } from "date-fns";
import type { Event, EventStatus } from "@/lib/types";

export const BLOCKING_STATUSES: EventStatus[] = ["option", "confirme"];

export function eventDateKeys(event: Pick<Event, "date_debut" | "date_fin">): string[] {
  if (!event.date_debut) return [];

  try {
    const start = parseISO(event.date_debut);
    const end = event.date_fin ? parseISO(event.date_fin) : start;
    if (!isValid(start)) return [event.date_debut.slice(0, 10)];
    const endDate = isValid(end) ? end : start;
    const rangeStart = start <= endDate ? start : endDate;
    const rangeEnd = start <= endDate ? endDate : start;

    return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) =>
      format(d, "yyyy-MM-dd"),
    );
  } catch {
    return [event.date_debut.slice(0, 10)];
  }
}

export function getBlockedDateSet(
  events: Pick<
    Event,
    "id" | "statut" | "date_debut" | "date_fin" | "archived_at" | "cloture_at"
  >[],
  excludeEventId?: string,
): Set<string> {
  const blocked = new Set<string>();

  for (const event of events) {
    if (excludeEventId && event.id === excludeEventId) continue;
    if ("archived_at" in event && event.archived_at) continue;
    if ("cloture_at" in event && event.cloture_at) continue;
    if (!BLOCKING_STATUSES.includes(event.statut)) continue;
    for (const key of eventDateKeys(event)) blocked.add(key);
  }

  return blocked;
}

export function isDateBlocked(
  dateKey: string | null | undefined,
  blocked: Set<string>,
): boolean {
  if (!dateKey) return false;
  return blocked.has(dateKey.slice(0, 10));
}

export function isEventRangeBlocked(
  events: Pick<
    Event,
    "id" | "statut" | "date_debut" | "date_fin" | "archived_at" | "cloture_at"
  >[],
  dateDebut: string | null,
  dateFin: string | null | undefined,
  excludeEventId?: string,
): boolean {
  if (!dateDebut) return false;

  const blocked = getBlockedDateSet(events, excludeEventId);
  const keys = eventDateKeys({
    date_debut: dateDebut,
    date_fin: dateFin ?? dateDebut,
  });

  return keys.some((key) => isDateBlocked(key, blocked));
}

export function eventsOnDate(
  events: Event[],
  dateKey: string,
): Event[] {
  return events.filter((event) => eventDateKeys(event).includes(dateKey));
}

export function isEventClosed(
  event: Pick<Event, "cloture_at">,
): boolean {
  return Boolean(event.cloture_at);
}

export function isActiveBlockingEvent(
  event: Pick<Event, "statut" | "cloture_at">,
): boolean {
  if (isEventClosed(event)) return false;
  return BLOCKING_STATUSES.includes(event.statut);
}

export function getCalendarEventStyle(event: Event): string {
  if (isEventClosed(event)) return CALENDAR_CLOSED_STYLE;
  return CALENDAR_EVENT_STYLES[event.statut];
}

export const CALENDAR_CLOSED_STYLE =
  "border-blue-400 bg-blue-200 text-blue-950 text-xs leading-snug font-semibold shadow-sm";

export function sortEventsForCalendarDay(events: Event[]): Event[] {
  function priority(event: Event): number {
    if (isEventClosed(event)) return 1;
    if (event.statut === "confirme") return 0;
    if (event.statut === "option") return 2;
    return 3;
  }

  return [...events].sort((a, b) => {
    const priorityDiff = priority(a) - priority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.nom_evenement || a.nom_des_maries).localeCompare(
      b.nom_evenement || b.nom_des_maries,
      "fr",
    );
  });
}

export function dayCellHighlight(events: Event[]): string {
  if (events.some((e) => isActiveBlockingEvent(e))) {
    if (events.some((e) => e.statut === "confirme" && !isEventClosed(e))) {
      return "bg-emerald-50/40";
    }
    if (events.some((e) => e.statut === "option")) return "bg-amber-50/40";
  }
  if (events.some((e) => isEventClosed(e))) return "bg-blue-50/40";
  return "";
}

export const CALENDAR_EVENT_STYLES: Record<EventStatus, string> = {
  prospect:
    "border-slate-200/90 bg-slate-100/90 text-slate-600 text-[11px] leading-tight font-normal opacity-90",
  option:
    "border-amber-400 bg-amber-200 text-amber-950 text-xs leading-snug font-semibold shadow-sm",
  confirme:
    "border-emerald-400 bg-emerald-200 text-emerald-950 text-xs leading-snug font-semibold shadow-sm",
};
