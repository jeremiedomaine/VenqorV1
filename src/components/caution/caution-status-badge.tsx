import {
  CAUTION_STATUS_LABELS,
  type CautionDemoStatus,
} from "@/lib/caution-demo-data";
import { cn } from "@/lib/utils";

const STYLES: Record<CautionDemoStatus, string> = {
  en_attente: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  empreinte: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  liberee: "border-slate-400/30 bg-slate-500/15 text-slate-300",
  expiree: "border-rose-400/40 bg-rose-500/15 text-rose-200",
};

export function CautionStatusBadge({ status }: { status: CautionDemoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {CAUTION_STATUS_LABELS[status]}
    </span>
  );
}
