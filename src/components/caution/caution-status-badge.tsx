import { Badge } from "@/components/ui/badge";
import {
  EDL_STATUS_LABELS,
  SWIKLY_STATUS_LABELS,
  type EdlStatus,
  type SwiklyStatus,
} from "@/lib/caution-demo-data";
import { cn } from "@/lib/utils";

const SWIKLY_STYLES: Record<SwiklyStatus, string> = {
  a_envoyer: "bg-amber-50 text-amber-700",
  envoye: "bg-sky-50 text-sky-700",
  empreinte: "bg-emerald-50 text-emerald-700",
  liberee: "bg-slate-100 text-slate-700",
  expiree: "bg-rose-50 text-rose-700",
};

const EDL_STYLES: Record<EdlStatus, string> = {
  manquant: "bg-amber-50 text-amber-700",
  enregistree: "bg-indigo-50 text-indigo-700",
  envoyee: "bg-emerald-50 text-emerald-700",
};

export function SwiklyStatusBadge({ status }: { status: SwiklyStatus }) {
  return (
    <Badge className={cn(SWIKLY_STYLES[status])}>
      {SWIKLY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function EdlStatusBadge({ status }: { status: EdlStatus }) {
  return (
    <Badge className={cn(EDL_STYLES[status])}>{EDL_STATUS_LABELS[status]}</Badge>
  );
}

/** @deprecated alias — keep builds that still import CautionStatusBadge */
export function CautionStatusBadge({
  status,
}: {
  status: SwiklyStatus;
}) {
  return <SwiklyStatusBadge status={status} />;
}
