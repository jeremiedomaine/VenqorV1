import { isEventClosed } from "@/lib/calendar-events";
import type { Event, KanbanColumnId } from "@/lib/types";

export function getKanbanColumnForEvent(
  event: Pick<Event, "statut" | "cloture_at">,
): KanbanColumnId {
  if (isEventClosed(event)) return "cloture";
  return event.statut;
}

export function eventMatchesKanbanColumn(
  event: Event,
  columnId: KanbanColumnId,
): boolean {
  return getKanbanColumnForEvent(event) === columnId;
}

export const DEFAULT_VISIBLE_KANBAN_COLUMNS: KanbanColumnId[] = [
  "prospect",
  "option",
  "confirme",
  "cloture",
];

export const KANBAN_COLUMNS_STORAGE_KEY = "venqor-kanban-visible-columns";

export function loadVisibleKanbanColumns(): KanbanColumnId[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_KANBAN_COLUMNS;
  try {
    const raw = localStorage.getItem(KANBAN_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_KANBAN_COLUMNS;
    const parsed = JSON.parse(raw) as KanbanColumnId[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_VISIBLE_KANBAN_COLUMNS;
    }
    return parsed.filter((id) =>
      DEFAULT_VISIBLE_KANBAN_COLUMNS.includes(id),
    );
  } catch {
    return DEFAULT_VISIBLE_KANBAN_COLUMNS;
  }
}

export function saveVisibleKanbanColumns(columns: KanbanColumnId[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KANBAN_COLUMNS_STORAGE_KEY, JSON.stringify(columns));
}
