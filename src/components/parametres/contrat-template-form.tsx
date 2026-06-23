"use client";

import { useRef, useState } from "react";
import { FileText, FileType, Upload } from "lucide-react";
import {
  removeContratTemplate,
  uploadContratDocxTemplate,
  uploadContratTemplate,
} from "@/actions/contrat-template";
import { ContratSignableTagsInfo } from "@/components/parametres/contrat-signable-tags-info";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";

/** Configuration contrat — visible uniquement pour l'équipe Venqor. */
export function ContratTemplateForm({
  hasCustomTemplate,
  hasDocxTemplate,
  templateMode,
  filename,
  docxFilename,
}: {
  hasCustomTemplate: boolean;
  hasDocxTemplate: boolean;
  templateMode: "docx" | "pdf" | null;
  filename: string | null;
  docxFilename: string | null;
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          ? "Modèle Word enregistré — vérifiez les tags Signable ci-dessous."
          : "Modèle Word enregistré — uploadez un PDF d'aperçu si besoin.",
      );
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
      setSuccess("PDF enregistré.");
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
      setSuccess("Modèles retirés.");
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/40 p-4 text-sm text-indigo-950">
        <p className="font-medium">Configuration Venqor (interne)</p>
        <p className="mt-1 text-indigo-900/90">
          Uploadez le modèle Word préparé avec les variables Venqor et les tags
          Signable pour les signatures. Le domaine ne voit pas cette section.
        </p>
      </div>

      <form action={handleDocxUpload} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-start gap-3">
            <FileType className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-900">
                {hasDocxTemplate ? "Modèle Word actif" : "Modèle Word (.docx)"}
              </p>
              {docxFilename && (
                <p className="truncate text-sm text-slate-600">{docxFilename}</p>
              )}
            </div>
          </div>
        </div>
        <input
          ref={docxInputRef}
          id="contrat_docx"
          name="contrat_docx"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#4F46E5]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#4F46E5] hover:file:bg-[#4F46E5]/15"
        />
        <Button type="submit" disabled={pending} className="gap-2">
          <Upload className="h-4 w-4" />
          {pending ? "Enregistrement…" : "Enregistrer le modèle Word"}
        </Button>
      </form>

      <form action={handlePdfUpload} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-900">
                PDF d&apos;aperçu (signatures)
              </p>
              {filename && (
                <p className="truncate text-xs text-slate-500">{filename}</p>
              )}
              {templateMode === "docx" && (
                <p className="text-xs text-slate-500">
                  Généré auto à l&apos;upload Word, ou uploadez manuellement.
                </p>
              )}
            </div>
          </div>
        </div>
        <input
          ref={pdfInputRef}
          id="contrat_pdf"
          name="contrat_pdf"
          type="file"
          accept="application/pdf,.pdf"
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200/80"
        />

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

      <ContratSignableTagsInfo />

      {hasDocxTemplate && !hasCustomTemplate && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          PDF d&apos;aperçu en cours de génération… Rechargez la page ou uploadez
          un PDF manuellement.
        </p>
      )}
    </div>
  );
}
