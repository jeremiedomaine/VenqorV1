import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
  type PaymentStatus,
} from "@/lib/types";

const eventStyles: Record<EventStatus, string> = {
  prospect: "bg-slate-100 text-slate-700",
  option: "bg-amber-50 text-amber-700",
  confirme: "bg-emerald-50 text-emerald-700",
};

const paymentStyles: Record<PaymentStatus, string> = {
  en_attente: "bg-amber-50 text-amber-700",
  declare_paye: "bg-sky-50 text-sky-700",
  paye: "bg-emerald-50 text-emerald-700",
};

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge className={eventStyles[status]}>
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const labels = {
    en_attente: "En attente",
    declare_paye: "Déclaré payé",
    paye: "Payé",
  };
  return <Badge className={paymentStyles[status]}>{labels[status]}</Badge>;
}
