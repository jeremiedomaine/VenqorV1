"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function PilotageYearSelector({
  years,
  selectedYear,
}: {
  years: number[];
  selectedYear: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  function setYear(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (year === currentYear) params.delete("annee");
    else params.set("annee", String(year));
    const query = params.toString();
    router.replace(query ? `/pilotage?${query}` : "/pilotage", { scroll: false });
  }

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => setYear(year)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            year === selectedYear
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
  );
}
