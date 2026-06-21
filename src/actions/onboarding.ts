"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/lib/action-result";
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
  return profile.workspace_id;
}

function revalidateWorkspacePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/parametres");
  revalidatePath("/portail", "layout");
}

export async function saveOnboardingDomain(
  formData: FormData,
): Promise<ActionResult> {
  const nomDomaine = String(formData.get("nom_domaine") ?? "").trim();
  if (!nomDomaine) {
    return actionError("Indiquez le nom de votre domaine.");
  }

  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { error } = await supabase
    .from("workspaces")
    .update({ nom_domaine: nomDomaine })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer le nom du domaine.");
  revalidateWorkspacePaths();
  return {};
}

export async function saveOnboardingIban(
  formData: FormData,
): Promise<ActionResult> {
  const iban = String(formData.get("iban") ?? "").replace(/\s/g, "").trim();
  const titulaire = String(formData.get("titulaire_compte") ?? "").trim();

  if (!iban) {
    return actionError("Indiquez votre IBAN pour recevoir les acomptes.");
  }

  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/i.test(iban)) {
    return actionError("Format IBAN invalide.");
  }

  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { error } = await supabase
    .from("workspaces")
    .update({
      mode_paiement_defaut: "virement",
      iban,
      titulaire_compte: titulaire || null,
    })
    .eq("id", workspaceId);

  if (error) return actionError("Impossible d'enregistrer l'IBAN.");
  revalidateWorkspacePaths();
  return {};
}
