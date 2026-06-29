import type { Event } from "@/lib/types";

export const ALL_YEARS_VALUE = "toutes" as const;
export type YearFilter = number | typeof ALL_YEARS_VALUE;

export function eventCalendarYear(event: Pick<Event, "date_debut">): number | null {
  if (!event.date_debut) return null;
  return new Date(event.date_debut).getFullYear();
}

export function buildYearOptionsFromEvents(events: Event[]): number[] {
  const fromEvents = events
    .map((e) => eventCalendarYear(e))
    .filter((y): y is number => y !== null);

  const currentYear = new Date().getFullYear();
  const min =
    fromEvents.length > 0
      ? Math.min(currentYear - 1, ...fromEvents)
      : currentYear - 1;
  const max =
    fromEvents.length > 0
      ? Math.max(currentYear + 3, ...fromEvents)
      : currentYear + 3;

  const years: number[] = [];
  for (let y = min; y <= max; y++) years.push(y);
  return years;
}

export function parseYearFilterParam(
  value: string | null | undefined,
): YearFilter {
  if (!value || value === ALL_YEARS_VALUE) return ALL_YEARS_VALUE;
  const year = Number.parseInt(value, 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return ALL_YEARS_VALUE;
  }
  return year;
}

export function filterEventsByYear(events: Event[], filter: YearFilter): Event[] {
  if (filter === ALL_YEARS_VALUE) return events;
  return events.filter((e) => eventCalendarYear(e) === filter);
}

export function yearFilterLabel(filter: YearFilter): string {
  return filter === ALL_YEARS_VALUE ? "Toutes les années" : String(filter);
}
