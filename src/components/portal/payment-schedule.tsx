import { Check } from "lucide-react";
import { capitalizeFirst, formatDateShort } from "@/lib/portal-utils";
import { formatCurrency } from "@/lib/utils";
import type { PortalData } from "@/lib/types";

type Payment = PortalData["payments"][number];

function paymentStatusLabel(payment: Payment): string {
  if (payment.statut === "paye") return "Réglé";
  if (payment.statut === "declare_paye") return "En vérification";
  return "À venir";
}

export function PaymentSchedule({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return null;

  return (
    <div className="space-y-1">
      {payments.map((payment, index) => {
        const isPaid = payment.statut === "paye";
        const isDeclared = payment.statut === "declare_paye";
        const isLast = index === payments.length - 1;

        return (
          <div key={payment.id} className="relative flex gap-5">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  isPaid
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : isDeclared
                      ? "border-sky-300 bg-sky-50 text-sky-600"
                      : "border-zinc-200 bg-white text-zinc-300"
                }`}
              >
                {isPaid ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isDeclared ? "bg-sky-400" : "bg-zinc-300"
                    }`}
                  />
                )}
              </div>
              {!isLast && (
                <div className="my-1 w-px flex-1 bg-zinc-200 min-h-[2rem]" />
              )}
            </div>

            <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p
                    className={`font-medium ${
                      isPaid ? "text-zinc-900" : "text-zinc-700"
                    }`}
                  >
                    {payment.label}
                  </p>
                  {payment.date_echeance && (
                    <p className="mt-0.5 text-sm text-zinc-400">
                      Échéance ·{" "}
                      {capitalizeFirst(
                        formatDateShort(payment.date_echeance) ?? "",
                      )}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 sm:mt-0">
                  <span className="font-portal text-lg text-zinc-800">
                    {formatCurrency(Number(payment.montant))}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${
                      isPaid
                        ? "bg-zinc-900 text-white"
                        : isDeclared
                          ? "bg-sky-100 text-sky-700"
                          : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {paymentStatusLabel(payment)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
