"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ALL_YEARS_VALUE,
  type YearFilter,
} from "@/lib/year-filter";
import { cn } from "@/lib/utils";

export function PipelineYearSelector({
  years,
  selectedFilter,
}: {
  years: number[];
  selectedFilter: YearFilter;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  function setFilter(filter: YearFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === ALL_YEARS_VALUE) params.delete("annee");
    else params.set("annee", String(filter));
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Année</span>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1">
        <button
          type="button"
          onClick={() => setFilter(ALL_YEARS_VALUE)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            selectedFilter === ALL_YEARS_VALUE
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          Toutes
        </button>
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setFilter(year)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedFilter === year
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {year}
            {year === currentYear && (
              <span className="ml-1 text-xs font-normal text-slate-400">
                (en cours)
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
