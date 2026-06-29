"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { sendContractForEvent } from "@/actions/esign-contract";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatContratStatutLabel } from "@/lib/contrat-display";
import { getEventCopy } from "@/lib/event-copy";
import { type ContratStatut } from "@/lib/types";

export function SendContractButton({
  eventId,
  typeEvenement,
  coupleEmail,
  contratStatut,
  contratEnvoyeAt,
  contratSigneAt,
  contratSignaturesDone,
  contratSignaturesTotal,
  contratReady,
}: {
  eventId: string;
  typeEvenement: string;
  coupleEmail: string;
  contratStatut: ContratStatut;
  contratEnvoyeAt: string | null;
  contratSigneAt: string | null;
  contratSignaturesDone: number;
  contratSignaturesTotal: number;
  contratReady: boolean;
}) {
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = useMemo(() => getEventCopy(typeEvenement), [typeEvenement]);

  const canSend =
    contratStatut === "non_envoye" ||
    contratStatut === "refuse" ||
    contratStatut === "expire";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-4 w-4 text-[#4F46E5]" />
          Contrat (Signable)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Envoie le {copy.contractType} à {copy.bothSigners} pour signature
          électronique.
          {!contratReady && (
            <span className="mt-1 block text-amber-700">
              Contrat non configuré — contactez l&apos;équipe Venqor pour
              finaliser votre modèle avant envoi.
            </span>
          )}
          {!coupleEmail && (
            <span className="mt-1 block text-amber-700">
              Renseignez l&apos;email de {copy.clientReference} dans le dossier.
            </span>
          )}
        </p>

        <p className="text-sm font-medium text-slate-800">
          Statut :{" "}
          {formatContratStatutLabel(
            contratStatut,
            contratSignaturesDone,
            contratSignaturesTotal,
          )}
        </p>

        {contratEnvoyeAt && contratStatut !== "non_envoye" && (
          <p className="text-xs text-slate-500">
            Envoyé le {new Date(contratEnvoyeAt).toLocaleDateString("fr-FR")}
            {contratSigneAt &&
              ` · Signé le ${new Date(contratSigneAt).toLocaleDateString("fr-FR")}`}
          </p>
        )}

        {contratStatut === "en_cours" && (
          <p className="text-xs text-slate-500">
            {contratSignaturesDone > 0 &&
            contratSignaturesDone < contratSignaturesTotal
              ? `${contratSignaturesDone} ${copy.signerSingular} sur ${contratSignaturesTotal} a signé — en attente de l'autre signature.`
              : `Signable a envoyé les liens de signature par email à ${copy.bothSigners}.`}
          </p>
        )}

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {warning && <p className="text-sm text-amber-700">{warning}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {canSend && (
          <Button
            type="button"
            variant="outline"
            disabled={pending || !coupleEmail || !contratReady}
            onClick={() =>
              void run(async () => {
                setMessage(null);
                setWarning(null);
                setError(null);
                const result = await sendContractForEvent(eventId);
                if (result.ok) {
                  if (result.depositEmailSent) {
                    setMessage(
                      `Contrat envoyé — email acompte envoyé à ${copy.clientReference}.`,
                    );
                  } else {
                    setMessage(
                      `Contrat envoyé — ${copy.clientsReference} recevront un email Signable.`,
                    );
                  }
                  if (result.depositEmailWarning) {
                    setWarning(result.depositEmailWarning);
                  }
                  router.refresh();
                } else {
                  setError(result.error ?? "Envoi impossible.");
                }
              })
            }
          >
            {pending ? "Envoi…" : "Envoyer le contrat"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
