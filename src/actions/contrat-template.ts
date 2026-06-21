"use server";

import { revalidatePath } from "next/cache";
import {
  CONTRAT_STORAGE_BUCKET,
  contratDocxStoragePath,
  contratTemplateStoragePath,
  generatePreviewPdfFromDocx,
} from "@/lib/contrat-template";
import { ContratMergeError } from "@/lib/contrat-merge";
import { ContratPdfConvertError } from "@/lib/contrat-pdf-convert";
import { requireWorkspaceClient } from "@/lib/workspace-session";

const MAX_BYTES = 10 * 1024 * 1024;

async function getVenqorContratContext() {
  const { session, workspaceId, supabase } = await requireWorkspaceClient();
  if (!session.isVenqorAdmin) {
    throw new Error("Accès réservé à l'équipe Venqor.");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      "nom_domaine, contact_nom, contact_email, contact_telephone, facturation_acompte_label, facturation_acompte_pct, facturation_solde_label, facturation_solde_pct",
    )
    .eq("id", workspaceId)
    .single();

  if (!workspace) throw new Error("Workspace introuvable");

  return { workspaceId, supabase, workspace };
}

function clearSignatureZonesUpdate() {
  return {
    contrat_signature_zones: null,
    contrat_signature_zones_updated_at: null,
  };
}

export async function uploadContratDocxTemplate(
  formData: FormData,
): Promise<{ error?: string; success?: boolean; previewGenerated?: boolean; warning?: string }> {
  const file = formData.get("contrat_docx");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier Word (.docx)." };
  }

  const lower = file.name.toLowerCase();
  if (
    !lower.endsWith(".docx") &&
    file.type !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return { error: "Le fichier doit être un document Word (.docx)." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "Fichier trop volumineux (max 10 Mo)." };
  }

  const { workspaceId, supabase, workspace } = await getVenqorContratContext();
  const docxPath = contratDocxStoragePath(workspaceId);
  const pdfPath = contratTemplateStoragePath(workspaceId);
  const docxBytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CONTRAT_STORAGE_BUCKET)
    .upload(docxPath, docxBytes, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  let previewGenerated = false;
  let previewWarning: string | undefined;

  try {
    const previewPdf = await generatePreviewPdfFromDocx(docxBytes, workspace);
    await supabase.storage.from(CONTRAT_STORAGE_BUCKET).upload(pdfPath, previewPdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    previewGenerated = true;
  } catch (err) {
    previewWarning =
      err instanceof ContratPdfConvertError
        ? `${err.message} Uploadez un PDF d'aperçu pour placer les signatures.`
        : "PDF d'aperçu non généré — uploadez un PDF pour placer les signatures.";
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({
      contrat_template_docx_path: docxPath,
      contrat_template_docx_filename: file.name,
      contrat_template_docx_updated_at: new Date().toISOString(),
      contrat_template_mode: "docx",
      ...(previewGenerated
        ? {
            contrat_template_path: pdfPath,
            contrat_template_filename: "contrat-apercu.pdf",
            contrat_template_updated_at: new Date().toISOString(),
          }
        : {}),
      ...clearSignatureZonesUpdate(),
    })
    .eq("id", workspaceId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/parametres");
  revalidatePath("/evenements", "layout");

  if (previewWarning) {
    return { success: true, previewGenerated: false, warning: previewWarning };
  }

  return {
    success: true,
    previewGenerated,
  };
}

export async function uploadContratTemplate(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const file = formData.get("contrat_pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier PDF." };
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Le fichier doit être un PDF." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "PDF trop volumineux (max 10 Mo)." };
  }

  const { workspaceId, supabase } = await getVenqorContratContext();
  const storagePath = contratTemplateStoragePath(workspaceId);
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CONTRAT_STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({
      contrat_template_path: storagePath,
      contrat_template_filename: file.name,
      contrat_template_updated_at: new Date().toISOString(),
      contrat_template_mode: "pdf",
      ...clearSignatureZonesUpdate(),
    })
    .eq("id", workspaceId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/parametres");
  revalidatePath("/evenements", "layout");
  return { success: true };
}

export async function removeContratTemplate(): Promise<{
  error?: string;
  success?: boolean;
}> {
  const { workspaceId, supabase } = await getVenqorContratContext();
  const pdfPath = contratTemplateStoragePath(workspaceId);
  const docxPath = contratDocxStoragePath(workspaceId);

  await supabase.storage
    .from(CONTRAT_STORAGE_BUCKET)
    .remove([pdfPath, docxPath]);

  const { error } = await supabase
    .from("workspaces")
    .update({
      contrat_template_path: null,
      contrat_template_filename: null,
      contrat_template_updated_at: null,
      contrat_template_docx_path: null,
      contrat_template_docx_filename: null,
      contrat_template_docx_updated_at: null,
      contrat_template_mode: null,
      ...clearSignatureZonesUpdate(),
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  revalidatePath("/evenements", "layout");
  return { success: true };
}

export async function previewContratMerge(
  eventId: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const { workspaceId, supabase } = await getVenqorContratContext();

    const { data: event } = await supabase
      .from("events")
      .select(
        "nom_evenement, nom_des_maries, marie1_prenom, marie1_nom, marie2_prenom, marie2_nom, email, telephone, adresse_postale, date_debut, date_fin, prix_total",
      )
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!event) return { error: "Dossier introuvable" };

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (!workspace || workspace.contrat_template_mode !== "docx") {
      return { error: "Modèle Word non configuré pour ce domaine." };
    }

    const { data: payments } = await supabase
      .from("payments")
      .select("label, montant")
      .eq("event_id", eventId)
      .order("date_echeance", { ascending: true });

    const { loadContractPdfForEvent } = await import("@/lib/contrat-template");
    await loadContractPdfForEvent(
      supabase,
      workspaceId,
      workspace,
      { event, payments: payments ?? [] },
    );

    return { ok: true };
  } catch (err) {
    if (err instanceof ContratMergeError || err instanceof ContratPdfConvertError) {
      return { error: err.message };
    }
    if (err instanceof Error) return { error: err.message };
    return { error: "Test de fusion impossible." };
  }
}
