"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { sendDepositPaymentRequestEmail } from "@/actions/payment-emails";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { AcompteSignatureTiming } from "@/lib/types";

export function SendDepositRequestButton({
  eventId,
  coupleEmail,
  hasPendingDeposit,
  paymentId,
  timing,
  contractSigned,
  sentAt,
}: {
  eventId: string;
  coupleEmail: string;
  hasPendingDeposit: boolean;
  paymentId?: string;
  timing: AcompteSignatureTiming;
  contractSigned: boolean;
  sentAt: string | null;
}) {
  const { pending, run } = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasPendingDeposit) return null;

  const waitingForSignature =
    timing === "after_contract" && !contractSigned && !sentAt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-[#4F46E5]" />
          Demande d&apos;acompte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          {timing === "with_contract"
            ? "Envoi automatique en même temps que le contrat si l'automation est activée."
            : "Envoi automatique après signature du contrat par les deux mariés."}
          {!coupleEmail && (
            <span className="mt-1 block text-amber-700">
              Renseignez l&apos;email du couple dans le dossier.
            </span>
          )}
        </p>
        {waitingForSignature && (
          <p className="text-xs text-slate-500">
            L&apos;email partira automatiquement une fois le contrat signé.
          </p>
        )}
        {sentAt && (
          <p className="text-xs text-slate-500">
            Email acompte déjà envoyé le{" "}
            {new Date(sentAt).toLocaleDateString("fr-FR")}.
          </p>
        )}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="button"
          variant="outline"
          disabled={pending || !coupleEmail || Boolean(sentAt)}
          onClick={() =>
            void run(async () => {
              setMessage(null);
              setError(null);
              const result = await sendDepositPaymentRequestEmail(
                eventId,
                paymentId,
              );
              if (result.ok) {
                setMessage(
                  result.skipped
                    ? "Email simulé (mode dev — configurez RESEND_API_KEY)."
                    : "Email d'acompte envoyé au couple.",
                );
              } else {
                setError(result.error ?? "Envoi impossible.");
              }
            })
          }
        >
          {pending ? "Envoi…" : "Envoyer la demande d'acompte"}
        </Button>
      </CardContent>
    </Card>
  );
}
