"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { sendPaymentRequestEmail } from "@/actions/payment-emails";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsyncAction } from "@/hooks/use-async-action";

export function SendPaymentRequestButton({
  eventId,
  coupleEmail,
  hasPendingPayment,
  paymentId,
  soldeWindowDays = 30,
  sentAt,
}: {
  eventId: string;
  coupleEmail: string;
  hasPendingPayment: boolean;
  paymentId?: string;
  soldeWindowDays?: number;
  sentAt: string | null;
}) {
  const { pending, run } = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasPendingPayment) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-[#4F46E5]" />
          Demande de solde (J-{soldeWindowDays})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Envoie au couple l&apos;email de règlement du solde avec le lien vers
          la page de paiement. Envoi automatique dès J-{soldeWindowDays} du
          mariage si l&apos;automation est activée.
          {!coupleEmail && (
            <span className="mt-1 block text-amber-700">
              Renseignez l&apos;email du couple dans le dossier.
            </span>
          )}
        </p>
        {sentAt && (
          <p className="text-xs text-slate-500">
            Email solde déjà envoyé le{" "}
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
              const result = await sendPaymentRequestEmail(eventId, paymentId);
              if (result.ok) {
                setMessage(
                  result.skipped
                    ? "Email simulé (mode dev — configurez RESEND_API_KEY)."
                    : "Email de solde envoyé au couple.",
                );
              } else {
                setError(result.error ?? "Envoi impossible.");
              }
            })
          }
        >
          {pending ? "Envoi…" : "Envoyer la demande de solde"}
        </Button>
      </CardContent>
    </Card>
  );
}
