"use server";

import { revalidatePath } from "next/cache";
import {
  parseContratSignatureZones,
  type ContratSignatureZones,
} from "@/lib/contrat-signature-zones";
import { createClient } from "@/lib/supabase/server";

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

export async function saveContratSignatureZones(
  zones: ContratSignatureZones,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = parseContratSignatureZones(zones);
  if (!parsed) {
    return { error: "Zones de signature invalides." };
  }

  const { workspaceId, supabase } = await getWorkspaceId();

  const { error } = await supabase
    .from("workspaces")
    .update({
      contrat_signature_zones: parsed,
      contrat_signature_zones_updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  revalidatePath("/evenements", "layout");
  return { success: true };
}
