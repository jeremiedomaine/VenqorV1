"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  distinctSignerEmails,
  sendYousignContract,
} from "@/lib/yousign/send-contract";
import { isYousignConfigured } from "@/lib/yousign/client";
import { maybeSendDepositAfterContract } from "@/lib/deposit-payment-email";
import { depositEmailUserMessage } from "@/lib/deposit-email-feedback";
import { syncAutoPayments } from "@/lib/sync-payments";

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

function trimName(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export async function sendContractForEvent(
  eventId: string,
): Promise<{
  ok?: boolean;
  error?: string;
  depositEmailSent?: boolean;
  depositEmailWarning?: string;
}> {
  if (!isYousignConfigured()) {
    return { error: "Yousign non configuré (YOUSIGN_API_KEY manquant)." };
  }

  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, workspace_id, statut, archived_at, cloture_at, nom_evenement, nom_des_maries, marie1_prenom, marie1_nom, marie2_prenom, marie2_nom, email, telephone, contrat_statut, yousign_signature_request_id, prix_total, date_debut",
    )
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event) return { error: "Événement introuvable" };
  if (event.archived_at) return { error: "Dossier archivé" };
  if (event.cloture_at) return { error: "Dossier clôturé" };
  if (event.statut !== "option") {
    return { error: "Le contrat s'envoie uniquement pour une date bloquée." };
  }
  if (event.contrat_statut === "en_cours") {
    return { error: "Un contrat est déjà en cours de signature." };
  }
  if (event.contrat_statut === "signe") {
    return { error: "Le contrat est déjà signé." };
  }

  const coupleEmail = event.email?.trim();
  if (!coupleEmail) {
    return { error: "Renseignez l'email du couple avant d'envoyer le contrat." };
  }

  const marie1First = trimName(event.marie1_prenom, "Signataire");
  const marie1Last = trimName(event.marie1_nom, "1");
  const marie2First = trimName(event.marie2_prenom, "Signataire");
  const marie2Last = trimName(event.marie2_nom, "2");

  const [email1, email2] = distinctSignerEmails(coupleEmail);

  const result = await sendYousignContract({
    eventId: event.id,
    eventLabel: event.nom_evenement || event.nom_des_maries,
    phoneNumber: event.telephone,
    signers: [
      { firstName: marie1First, lastName: marie1Last, email: email1 },
      { firstName: marie2First, lastName: marie2Last, email: email2 },
    ],
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const { error } = await supabase
    .from("events")
    .update({
      yousign_signature_request_id: result.signatureRequestId,
      contrat_statut: "en_cours",
      contrat_envoye_at: new Date().toISOString(),
      contrat_signe_at: null,
    })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  const prixTotal = Number(event.prix_total);
  if (prixTotal > 0) {
    await syncAutoPayments(
      supabase,
      workspaceId,
      eventId,
      prixTotal,
      event.date_debut,
    );
  }

  const depositResult = await maybeSendDepositAfterContract({
    supabase,
    eventId,
    workspaceId,
    timing: "with_contract",
  });

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return {
    ok: true,
    depositEmailSent:
      depositResult.ok && !depositResult.skipped && !depositResult.alreadySent,
    depositEmailWarning: depositEmailUserMessage(depositResult) ?? undefined,
  };
}
