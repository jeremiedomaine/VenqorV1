"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { sendContractForEvent } from "@/actions/yousign-contract";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  CONTRAT_STATUT_LABELS,
  type ContratStatut,
} from "@/lib/types";

export function SendContractButton({
  eventId,
  coupleEmail,
  contratStatut,
  contratEnvoyeAt,
  contratSigneAt,
  hasCustomTemplate,
}: {
  eventId: string;
  coupleEmail: string;
  contratStatut: ContratStatut;
  contratEnvoyeAt: string | null;
  contratSigneAt: string | null;
  hasCustomTemplate: boolean;
}) {
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSend =
    contratStatut === "non_envoye" ||
    contratStatut === "refuse" ||
    contratStatut === "expire";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-4 w-4 text-[#4F46E5]" />
          Contrat (Yousign)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Envoie le contrat aux deux mariés pour signature électronique.
          {!hasCustomTemplate && (
            <span className="mt-1 block text-amber-700">
              Modèle démo Venqor — uploadez votre PDF dans Paramètres → Contrat.
            </span>
          )}
          {!coupleEmail && (
            <span className="mt-1 block text-amber-700">
              Renseignez l&apos;email du couple dans le dossier.
            </span>
          )}
        </p>

        <p className="text-sm font-medium text-slate-800">
          Statut : {CONTRAT_STATUT_LABELS[contratStatut]}
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
            Yousign a envoyé les liens de signature par email aux deux mariés.
          </p>
        )}

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {warning && <p className="text-sm text-amber-700">{warning}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {canSend && (
          <Button
            type="button"
            variant="outline"
            disabled={pending || !coupleEmail}
            onClick={() =>
              void run(async () => {
                setMessage(null);
                setWarning(null);
                setError(null);
                const result = await sendContractForEvent(eventId);
                if (result.ok) {
                  if (result.depositEmailSent) {
                    setMessage(
                      "Contrat envoyé — email acompte envoyé au couple.",
                    );
                  } else {
                    setMessage(
                      "Contrat envoyé — les mariés recevront un email Yousign.",
                    );
                  }
                  if (result.depositEmailWarning) {
                    setWarning(result.depositEmailWarning);
                  }
                  if (result.usingDefaultTemplate) {
                    setWarning(
                      (w) =>
                        w ??
                        "Contrat envoyé avec le modèle démo — uploadez le vôtre dans Paramètres.",
                    );
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
