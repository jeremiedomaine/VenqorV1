import type { SupabaseClient } from "@supabase/supabase-js";
import { loadDemoContractPdf } from "@/lib/yousign/contrat-demo-pdf";

export const CONTRAT_STORAGE_BUCKET = "workspace-contrats";
export const CONTRAT_STORAGE_FILENAME = "contrat.pdf";

export function contratTemplateStoragePath(workspaceId: string): string {
  return `${workspaceId}/${CONTRAT_STORAGE_FILENAME}`;
}

export type LoadedContractPdf = {
  bytes: Buffer;
  source: "workspace" | "default";
  filename: string;
};

export async function loadContractPdfForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  templatePath: string | null | undefined,
): Promise<LoadedContractPdf> {
  if (templatePath) {
    const { data, error } = await supabase.storage
      .from(CONTRAT_STORAGE_BUCKET)
      .download(templatePath);

    if (!error && data) {
      const bytes = Buffer.from(await data.arrayBuffer());
      if (bytes.length > 0) {
        return {
          bytes,
          source: "workspace",
          filename: CONTRAT_STORAGE_FILENAME,
        };
      }
    }
  }

  return {
    bytes: loadDemoContractPdf(),
    source: "default",
    filename: "contrat-venqor-demo.pdf",
  };
}
