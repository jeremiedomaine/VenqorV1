"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { sendPaymentRequestEmail } from "@/actions/payment-emails";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SendPaymentRequestButton({
  eventId,
  coupleEmail,
  hasPendingPayment,
  sentAt,
}: {
  eventId: string;
  coupleEmail: string;
  hasPendingPayment: boolean;
  sentAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasPendingPayment) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-[#4F46E5]" />
          Demande de paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Envoie au couple un email Venqor avec le lien vers la page de paiement.
          {!coupleEmail && (
            <span className="mt-1 block text-amber-700">
              Renseignez l&apos;email du couple dans le dossier.
            </span>
          )}
        </p>
        {sentAt && (
          <p className="text-xs text-slate-500">
            Dernier envoi enregistré pour la prochaine échéance en attente.
          </p>
        )}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="button"
          variant="outline"
          disabled={pending || !coupleEmail}
          onClick={() =>
            startTransition(async () => {
              setMessage(null);
              setError(null);
              const result = await sendPaymentRequestEmail(eventId);
              if (result.ok) {
                setMessage(
                  result.skipped
                    ? "Email simulé (mode dev — configurez RESEND_API_KEY)."
                    : "Email de paiement envoyé au couple.",
                );
              } else {
                setError(result.error ?? "Envoi impossible.");
              }
            })
          }
        >
          {pending ? "Envoi…" : "Envoyer la demande de paiement"}
        </Button>
      </CardContent>
    </Card>
  );
}
