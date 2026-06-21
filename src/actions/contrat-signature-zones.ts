"use server";

import { revalidatePath } from "next/cache";
import {
  parseContratSignatureZones,
  type ContratSignatureZones,
} from "@/lib/contrat-signature-zones";
import { requireWorkspaceClient } from "@/lib/workspace-session";

async function getVenqorContratContext() {
  const { session, workspaceId, supabase } = await requireWorkspaceClient();
  if (!session.isVenqorAdmin) {
    throw new Error("Accès réservé à l'équipe Venqor.");
  }
  return { workspaceId, supabase };
}

export async function saveContratSignatureZones(
  zones: ContratSignatureZones,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = parseContratSignatureZones(zones);
  if (!parsed) {
    return { error: "Zones de signature invalides." };
  }

  const { workspaceId, supabase } = await getVenqorContratContext();

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
