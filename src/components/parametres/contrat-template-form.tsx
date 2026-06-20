"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import {
  removeContratTemplate,
  uploadContratTemplate,
} from "@/actions/contrat-template";
import { ContratSignaturePlacer } from "@/components/parametres/contrat-signature-placer";
import { Button } from "@/components/ui/button";
import type { ContratSignatureZones } from "@/lib/types";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ContratTemplateForm({
  hasCustomTemplate,
  filename,
  updatedAt,
  signatureZones,
  signatureZonesUpdatedAt,
}: {
  hasCustomTemplate: boolean;
  filename: string | null;
  updatedAt: string | null;
  signatureZones: ContratSignatureZones | null;
  signatureZonesUpdatedAt: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placerKey, setPlacerKey] = useState(
    `${updatedAt ?? "default"}-${signatureZonesUpdatedAt ?? "none"}`,
  );

  function handleUpload(formData: FormData) {
    setError(null);
    setSuccess(null);
    void run(async () => {
      const result = await uploadContratTemplate(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        "Modèle enregistré — placez les signatures ci-dessous puis enregistrez les emplacements.",
      );
      setPlacerKey(`${Date.now()}-reset`);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleRemove() {
    setError(null);
    setSuccess(null);
    void run(async () => {
      const result = await removeContratTemplate();
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Modèle personnalisé retiré — le modèle Venqor par défaut sera utilisé.");
      setPlacerKey(`${Date.now()}-removed`);
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {hasCustomTemplate
                ? "Votre modèle de contrat est actif"
                : "Modèle Venqor par défaut (démo)"}
            </p>
            {hasCustomTemplate && filename && (
              <p className="truncate text-sm text-slate-600">{filename}</p>
            )}
            {hasCustomTemplate && updatedAt && (
              <p className="text-xs text-slate-500">
                Mis à jour le{" "}
                {new Date(updatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {!hasCustomTemplate && (
              <p className="text-sm text-slate-600">
                Uploadez le PDF de votre domaine pour remplacer le modèle de
                démonstration.
              </p>
            )}
            {signatureZonesUpdatedAt && (
              <p className="text-xs text-emerald-700">
                Signatures configurées le{" "}
                {new Date(signatureZonesUpdatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <form action={handleUpload} className="space-y-4">
        <div>
          <label
            htmlFor="contrat_pdf"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Fichier PDF (max 10 Mo)
          </label>
          <input
            ref={inputRef}
            id="contrat_pdf"
            name="contrat_pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#4F46E5]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#4F46E5] hover:file:bg-[#4F46E5]/15"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending} className="gap-2">
            <Upload className="h-4 w-4" />
            {pending ? "Enregistrement…" : "Enregistrer le modèle"}
          </Button>
          {hasCustomTemplate && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleRemove}
            >
              Retirer le modèle
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 text-sm text-amber-950">
        <p className="font-medium">Option avancée : ancres Yousign dans le PDF</p>
        <p className="text-amber-900/90">
          Si vous préférez définir les emplacements dans Word, ajoutez en texte
          blanc :{" "}
          <span className="font-mono text-xs">{"{{s1|signature|200|80}}"}</span>{" "}
          et{" "}
          <span className="font-mono text-xs">{"{{s2|signature|200|80}}"}</span>.
          Les ancres du PDF priment sur le placement visuel ci-dessous.
        </p>
      </div>

      <ContratSignaturePlacer
        key={placerKey}
        initialZones={signatureZones}
      />
    </div>
  );
}
