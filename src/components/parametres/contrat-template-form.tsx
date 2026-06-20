"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import {
  removeContratTemplate,
  uploadContratTemplate,
} from "@/actions/contrat-template";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ContratTemplateForm({
  hasCustomTemplate,
  filename,
  updatedAt,
}: {
  hasCustomTemplate: boolean;
  filename: string | null;
  updatedAt: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleUpload(formData: FormData) {
    setError(null);
    setSuccess(null);
    void run(async () => {
      const result = await uploadContratTemplate(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Modèle enregistré — il sera utilisé pour les prochains envois Yousign.");
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
    });
  }

  return (
    <div className="space-y-6">
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
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 text-sm text-amber-950">
        <p className="font-medium">Ancres Yousign (2 mariés)</p>
        <p className="text-amber-900/90">
          Placez dans votre PDF, en blanc sur fond blanc ou en texte discret :
        </p>
        <ul className="list-inside list-disc space-y-1 font-mono text-xs text-amber-900">
          <li>{"{{s1|signature|200|80}}"} — 1er marié</li>
          <li>{"{{s2|signature|200|80}}"} — 2e marié</li>
        </ul>
        <p className="text-xs text-amber-800/90">
          Venqor n&apos;édite pas le contenu juridique : vous fournissez le
          contrat type de votre domaine tel quel.
        </p>
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
    </div>
  );
}
