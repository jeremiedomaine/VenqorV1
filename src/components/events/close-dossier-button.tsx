"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { closeEventDossier } from "@/actions/events";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/lib/types";

export function CloseDossierButton({
  eventId,
  prixTotal,
  balancePayment,
  hasPaymentSchedule,
}: {
  eventId: string;
  prixTotal: number;
  balancePayment: Payment | null;
  hasPaymentSchedule: boolean;
}) {
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setSuccess(null);
    void run(async () => {
      const result = await closeEventDossier(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Dossier clôturé — solde enregistré, suivi actif terminé.");
      router.refresh();
    });
  }

  const needsSchedule = prixTotal > 0 && !hasPaymentSchedule;

  return (
    <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/40 p-4">
      <FormFeedback error={error} success={success} onDismiss={() => { setError(null); setSuccess(null); }} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Clôturer le dossier</p>
          <p className="mt-1 text-sm text-slate-600">
            {prixTotal <= 0
              ? "Marquer le dossier comme terminé — il sortira du pipeline actif."
              : balancePayment
                ? `Marquer le solde (${balancePayment.label}, ${formatCurrency(Number(balancePayment.montant))}) comme payé et clôturer.`
                : "Tous les paiements sont réglés — vous pouvez clôturer le dossier."}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleClick}
          disabled={pending || needsSchedule}
          className="shrink-0 gap-2"
        >
          <CircleCheck className="h-4 w-4" />
          {pending
            ? "En cours…"
            : balancePayment
              ? `${balancePayment.label} payé — clôturer`
              : "Clôturer le dossier"}
        </Button>
      </div>
    </div>
  );
}
