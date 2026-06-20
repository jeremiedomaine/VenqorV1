"use client";

import { useRef, useState } from "react";
import { FileText, FileType, Upload } from "lucide-react";
import {
  removeContratTemplate,
  uploadContratDocxTemplate,
  uploadContratTemplate,
} from "@/actions/contrat-template";
import { ContratSignaturePlacer } from "@/components/parametres/contrat-signature-placer";
import { ContratVariablesReference } from "@/components/parametres/contrat-variables-reference";
import { Button } from "@/components/ui/button";
import type { ContratSignatureZones } from "@/lib/types";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ContratTemplateForm({
  hasCustomTemplate,
  hasDocxTemplate,
  templateMode,
  filename,
  docxFilename,
  updatedAt,
  docxUpdatedAt,
  signatureZones,
  signatureZonesUpdatedAt,
}: {
  hasCustomTemplate: boolean;
  hasDocxTemplate: boolean;
  templateMode: "docx" | "pdf" | null;
  filename: string | null;
  docxFilename: string | null;
  updatedAt: string | null;
  docxUpdatedAt: string | null;
  signatureZones: ContratSignatureZones | null;
  signatureZonesUpdatedAt: string | null;
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placerKey, setPlacerKey] = useState(
    `${updatedAt ?? "default"}-${docxUpdatedAt ?? "none"}-${signatureZonesUpdatedAt ?? "zones"}`,
  );

  function handleDocxUpload(formData: FormData) {
    setError(null);
    setWarning(null);
    setSuccess(null);
    void run(async () => {
      const result = await uploadContratDocxTemplate(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.warning) setWarning(result.warning);
      setSuccess(
        result.previewGenerated
          ? "Modèle Word enregistré — PDF d'aperçu généré. Placez les signatures ci-dessous."
          : "Modèle Word enregistré — uploadez un PDF d'aperçu pour placer les signatures.",
      );
      setPlacerKey(`${Date.now()}-docx`);
      if (docxInputRef.current) docxInputRef.current.value = "";
    });
  }

  function handlePdfUpload(formData: FormData) {
    setError(null);
    setWarning(null);
    setSuccess(null);
    void run(async () => {
      const result = await uploadContratTemplate(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        hasDocxTemplate
          ? "PDF d'aperçu enregistré — placez les signatures ci-dessous."
          : "PDF enregistré — mode sans variables (contrat statique).",
      );
      setPlacerKey(`${Date.now()}-pdf`);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    });
  }

  function handleRemove() {
    setError(null);
    setWarning(null);
    setSuccess(null);
    void run(async () => {
      const result = await removeContratTemplate();
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Modèles retirés — le modèle Venqor par défaut sera utilisé.");
      setPlacerKey(`${Date.now()}-removed`);
    });
  }

  return (
    <div className="space-y-8">
      <ContratVariablesReference />

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3">
          <FileType className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {hasDocxTemplate
                ? "Modèle Word avec variables actif"
                : "Modèle Word (recommandé)"}
            </p>
            {hasDocxTemplate && docxFilename && (
              <p className="truncate text-sm text-slate-600">{docxFilename}</p>
            )}
            {hasDocxTemplate && docxUpdatedAt && (
              <p className="text-xs text-slate-500">
                Mis à jour le{" "}
                {new Date(docxUpdatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {!hasDocxTemplate && (
              <p className="text-sm text-slate-600">
                Uploadez le contrat type de votre domaine au format Word (.docx)
                avec les variables ci-dessus. Venqor génère le PDF personnalisé
                à chaque envoi.
              </p>
            )}
          </div>
        </div>
      </div>

      <form action={handleDocxUpload} className="space-y-4">
        <div>
          <label
            htmlFor="contrat_docx"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Modèle Word (.docx, max 10 Mo)
          </label>
          <input
            ref={docxInputRef}
            id="contrat_docx"
            name="contrat_docx"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#4F46E5]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#4F46E5] hover:file:bg-[#4F46E5]/15"
          />
        </div>
        <Button type="submit" disabled={pending} className="gap-2">
          <Upload className="h-4 w-4" />
          {pending ? "Enregistrement…" : "Enregistrer le modèle Word"}
        </Button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-900">
              PDF d&apos;aperçu (signatures)
            </p>
            <p className="text-sm text-slate-600">
              {templateMode === "docx"
                ? "Généré automatiquement à partir du Word si Gotenberg est configuré. Sinon, uploadez un PDF représentatif pour placer les zones de signature."
                : hasCustomTemplate
                  ? "PDF utilisé tel quel pour l'envoi (sans variables)."
                  : "Modèle Venqor par défaut pour les tests."}
            </p>
            {hasCustomTemplate && filename && (
              <p className="truncate text-xs text-slate-500">{filename}</p>
            )}
          </div>
        </div>
      </div>

      <form action={handlePdfUpload} className="space-y-4">
        <div>
          <label
            htmlFor="contrat_pdf"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            PDF d&apos;aperçu ou contrat statique (max 10 Mo)
          </label>
          <input
            ref={pdfInputRef}
            id="contrat_pdf"
            name="contrat_pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200/80"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {warning && <p className="text-sm text-amber-700">{warning}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="outline" disabled={pending} className="gap-2">
            <Upload className="h-4 w-4" />
            {pending ? "Enregistrement…" : "Enregistrer le PDF"}
          </Button>
          {(hasCustomTemplate || hasDocxTemplate) && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleRemove}
            >
              Retirer les modèles
            </Button>
          )}
        </div>
      </form>

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

      {(hasCustomTemplate || !hasDocxTemplate) && (
        <ContratSignaturePlacer
          key={placerKey}
          initialZones={signatureZones}
        />
      )}

      {hasDocxTemplate && !hasCustomTemplate && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          PDF d&apos;aperçu en cours de génération… Rechargez la page dans quelques
          secondes, ou uploadez un PDF d&apos;aperçu manuellement.
        </p>
      )}
    </div>
  );
}
