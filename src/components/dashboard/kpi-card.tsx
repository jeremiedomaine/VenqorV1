import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: "indigo" | "emerald" | "amber" | "slate";
  href?: string;
  compact?: boolean;
}) {
  const accents = {
    indigo: "bg-indigo-50 text-[#4F46E5]",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold tracking-tight text-slate-900",
              compact ? "text-xl" : "mt-2 text-2xl",
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 truncate text-sm text-slate-500">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md",
            compact ? "h-9 w-9" : "h-10 w-10",
            accents[accent],
          )}
        >
          <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>
      </div>
      {href && (
        <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
