"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { confirmDepositPaid } from "@/actions/events";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/lib/types";

export function ConfirmDepositButton({
  eventId,
  prixTotal,
  depositPayment,
}: {
  eventId: string;
  prixTotal: number;
  depositPayment: Payment | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const needsSchedule = prixTotal > 0 && !depositPayment;
  const depositPaid = depositPayment?.statut === "paye";

  function handleClick() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await confirmDepositPaid(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Acompte enregistré — dossier passé en Confirmés.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-4">
      <FormFeedback
        error={error}
        success={success}
        onDismiss={() => {
          setError(null);
          setSuccess(null);
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Acompte payé</p>
          <p className="mt-1 text-sm text-slate-600">
            {prixTotal <= 0
              ? "Confirmer ce dossier et le passer en Confirmés."
              : depositPayment
                ? depositPaid
                  ? `L'acompte (${depositPayment.label}, ${formatCurrency(Number(depositPayment.montant))}) est déjà payé — confirmez le dossier.`
                  : `Marquer l'acompte (${depositPayment.label}, ${formatCurrency(Number(depositPayment.montant))}) comme payé et confirmer le dossier.`
                : "Générez l'échéancier à droite, puis confirmez l'acompte."}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleClick}
          disabled={pending || needsSchedule}
          className="shrink-0 gap-2"
        >
          <CircleCheck className="h-4 w-4" />
          {pending ? "En cours…" : "Acompte payé"}
        </Button>
      </div>
    </div>
  );
}
