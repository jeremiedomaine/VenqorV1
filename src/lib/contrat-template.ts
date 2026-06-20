import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeDocxTemplate, ContratMergeError } from "@/lib/contrat-merge";
import { convertDocxToPdf } from "@/lib/contrat-pdf-convert";
import {
  buildContratMergeData,
  buildSampleContratMergeData,
  type ContratMergeInput,
} from "@/lib/contrat-variables";
import { loadDemoContractPdf } from "@/lib/yousign/contrat-demo-pdf";

export const CONTRAT_STORAGE_BUCKET = "workspace-contrats";
export const CONTRAT_STORAGE_FILENAME = "contrat.pdf";
export const CONTRAT_DOCX_FILENAME = "contrat.docx";

export function contratTemplateStoragePath(workspaceId: string): string {
  return `${workspaceId}/${CONTRAT_STORAGE_FILENAME}`;
}

export function contratDocxStoragePath(workspaceId: string): string {
  return `${workspaceId}/${CONTRAT_DOCX_FILENAME}`;
}

export type LoadedContractPdf = {
  bytes: Buffer;
  source: "merged" | "workspace" | "default";
  filename: string;
};

export type WorkspaceContratConfig = {
  contrat_template_path: string | null;
  contrat_template_docx_path: string | null;
  contrat_template_mode: "docx" | "pdf" | null;
};

async function downloadStorageFile(
  supabase: SupabaseClient,
  path: string,
): Promise<Buffer | null> {
  const { data, error } = await supabase.storage
    .from(CONTRAT_STORAGE_BUCKET)
    .download(path);

  if (error || !data) return null;
  const bytes = Buffer.from(await data.arrayBuffer());
  return bytes.length > 0 ? bytes : null;
}

export async function generatePreviewPdfFromDocx(
  docxBytes: Buffer,
  workspace: ContratMergeInput["workspace"],
): Promise<Buffer> {
  const sampleData = buildSampleContratMergeData(workspace);
  const mergedDocx = mergeDocxTemplate(docxBytes, sampleData);
  return convertDocxToPdf(mergedDocx);
}

/** PDF statique du domaine (aperçu signatures ou envoi mode PDF). */
export async function loadContractPdfForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  templatePath: string | null | undefined,
): Promise<LoadedContractPdf> {
  if (templatePath) {
    const bytes = await downloadStorageFile(supabase, templatePath);
    if (bytes) {
      return {
        bytes,
        source: "workspace",
        filename: CONTRAT_STORAGE_FILENAME,
      };
    }
  }

  return {
    bytes: loadDemoContractPdf(),
    source: "default",
    filename: "contrat-venqor-demo.pdf",
  };
}

/** PDF fusionné pour un dossier (mode DOCX) ou PDF statique (mode PDF). */
export async function loadContractPdfForEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  workspace: WorkspaceContratConfig & ContratMergeInput["workspace"],
  mergeInput: Omit<ContratMergeInput, "workspace">,
): Promise<LoadedContractPdf> {
  const useDocx =
    workspace.contrat_template_mode === "docx" &&
    Boolean(workspace.contrat_template_docx_path);

  if (useDocx && workspace.contrat_template_docx_path) {
    const docxBytes = await downloadStorageFile(
      supabase,
      workspace.contrat_template_docx_path,
    );
    if (!docxBytes) {
      throw new ContratMergeError("Modèle Word introuvable.");
    }

    const mergeData = buildContratMergeData({
      workspace,
      event: mergeInput.event,
      payments: mergeInput.payments,
    });
    const mergedDocx = mergeDocxTemplate(docxBytes, mergeData);
    const pdfBytes = await convertDocxToPdf(mergedDocx);

    return {
      bytes: pdfBytes,
      source: "merged",
      filename: `contrat-${mergeInput.event.nom_evenement?.slice(0, 20) || "dossier"}.pdf`,
    };
  }

  return loadContractPdfForWorkspace(
    supabase,
    workspaceId,
    workspace.contrat_template_path,
  );
}

export { ContratMergeError };
