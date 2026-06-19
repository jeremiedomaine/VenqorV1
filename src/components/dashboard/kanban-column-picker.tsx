"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Columns3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_VISIBLE_KANBAN_COLUMNS,
  loadVisibleKanbanColumns,
  saveVisibleKanbanColumns,
} from "@/lib/kanban-columns";
import {
  KANBAN_BOARD_COLUMNS,
  KANBAN_COLUMN_LABELS,
  type KanbanColumnId,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function KanbanColumnPicker({
  visibleColumns,
  onChange,
}: {
  visibleColumns: KanbanColumnId[];
  onChange: (columns: KanbanColumnId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleColumn(columnId: KanbanColumnId) {
    const isVisible = visibleColumns.includes(columnId);
    if (isVisible && visibleColumns.length <= 1) return;

    const next = isVisible
      ? visibleColumns.filter((id) => id !== columnId)
      : KANBAN_BOARD_COLUMNS.filter(
          (id) => visibleColumns.includes(id) || id === columnId,
        );

    onChange(next);
    saveVisibleKanbanColumns(next);
  }

  function showAll() {
    onChange([...DEFAULT_VISIBLE_KANBAN_COLUMNS]);
    saveVisibleKanbanColumns(DEFAULT_VISIBLE_KANBAN_COLUMNS);
  }

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-2 whitespace-nowrap"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns3 className="h-4 w-4" />
        Colonnes ({visibleColumns.length})
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && (
        <div
          role="listbox"
          aria-label="Colonnes visibles"
          className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-1 text-xs font-medium text-slate-500">
            Afficher les colonnes
          </p>
          {KANBAN_BOARD_COLUMNS.map((columnId) => {
            const checked = visibleColumns.includes(columnId);
            const isLastVisible = checked && visibleColumns.length === 1;

            return (
              <button
                key={columnId}
                type="button"
                role="option"
                aria-selected={checked}
                disabled={isLastVisible}
                onClick={() => toggleColumn(columnId)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  checked
                    ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                    : "text-slate-700 hover:bg-slate-50",
                  isLastVisible && "cursor-not-allowed opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                      : "border-slate-300 bg-white",
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                {KANBAN_COLUMN_LABELS[columnId]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={showAll}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            Tout afficher
          </button>
        </div>
      )}
    </div>
  );
}

export function useVisibleKanbanColumns() {
  const [visibleColumns, setVisibleColumns] = useState<KanbanColumnId[]>(
    DEFAULT_VISIBLE_KANBAN_COLUMNS,
  );

  useEffect(() => {
    setVisibleColumns(loadVisibleKanbanColumns());
  }, []);

  return [visibleColumns, setVisibleColumns] as const;
}
