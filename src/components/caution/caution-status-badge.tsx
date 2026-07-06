import {
  CAUTION_STATUS_LABELS,
  type CautionDemoStatus,
} from "@/lib/caution-demo-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<CautionDemoStatus, string> = {
  en_attente: "bg-amber-50 text-amber-700",
  empreinte: "bg-emerald-50 text-emerald-700",
  liberee: "bg-slate-100 text-slate-700",
  expiree: "bg-rose-50 text-rose-700",
};

export function CautionStatusBadge({ status }: { status: CautionDemoStatus }) {
  return (
    <Badge className={cn(STYLES[status])}>{CAUTION_STATUS_LABELS[status]}</Badge>
  );
}
