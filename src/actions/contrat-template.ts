"use server";

import { revalidatePath } from "next/cache";
import {
  CONTRAT_STORAGE_BUCKET,
  contratTemplateStoragePath,
} from "@/lib/contrat-template";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;

async function getWorkspaceId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable");
  return { workspaceId: profile.workspace_id, supabase };
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

  const { workspaceId, supabase } = await getWorkspaceId();
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
      contrat_signature_zones: null,
      contrat_signature_zones_updated_at: null,
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
  const { workspaceId, supabase } = await getWorkspaceId();
  const storagePath = contratTemplateStoragePath(workspaceId);

  await supabase.storage.from(CONTRAT_STORAGE_BUCKET).remove([storagePath]);

  const { error } = await supabase
    .from("workspaces")
    .update({
      contrat_template_path: null,
      contrat_template_filename: null,
      contrat_template_updated_at: null,
      contrat_signature_zones: null,
      contrat_signature_zones_updated_at: null,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  revalidatePath("/evenements", "layout");
  return { success: true };
}
