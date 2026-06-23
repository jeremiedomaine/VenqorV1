"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceClient } from "@/lib/workspace-session";
import { distinctSignerEmails } from "@/lib/esign/signers";
import { sendSignableContract } from "@/lib/signable/send-contract";
import { isSignableConfigured } from "@/lib/signable/client";
import { maybeSendDepositAfterContract } from "@/lib/deposit-payment-email";
import { depositEmailUserMessage } from "@/lib/deposit-email-feedback";
import {
  ContratMergeError,
  loadContractPdfForEvent,
} from "@/lib/contrat-template";
import { ContratPdfConvertError } from "@/lib/contrat-pdf-convert";
import { syncAutoPayments } from "@/lib/sync-payments";
import { createServiceClient } from "@/lib/supabase/service";

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
  usingDefaultTemplate?: boolean;
  contractMerged?: boolean;
}> {
  if (!isSignableConfigured()) {
    return { error: "Signable non configuré (SIGNABLE_API_KEY manquant)." };
  }

  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, workspace_id, statut, archived_at, cloture_at, nom_evenement, nom_des_maries, marie1_prenom, marie1_nom, marie2_prenom, marie2_nom, email, telephone, adresse_postale, contrat_statut, esign_envelope_id, prix_total, date_debut, date_fin",
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

  const serviceSupabase = createServiceClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return { error: "Workspace introuvable" };

  const { data: payments } = await supabase
    .from("payments")
    .select("label, montant")
    .eq("event_id", eventId)
    .order("date_echeance", { ascending: true });

  let contractPdf;
  try {
    contractPdf = await loadContractPdfForEvent(
      serviceSupabase,
      workspaceId,
      workspace,
      { event, payments: payments ?? [] },
    );
  } catch (err) {
    if (err instanceof ContratMergeError || err instanceof ContratPdfConvertError) {
      return { error: err.message };
    }
    if (err instanceof Error) return { error: err.message };
    return { error: "Préparation du contrat impossible." };
  }

  const result = await sendSignableContract({
    eventId: event.id,
    workspaceId,
    eventLabel: event.nom_evenement || event.nom_des_maries,
    pdfBytes: contractPdf.bytes,
    pdfFilename: `contrat-${event.id.slice(0, 8)}.pdf`,
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
      esign_envelope_id: result.envelopeFingerprint,
      contrat_statut: "en_cours",
      contrat_envoye_at: new Date().toISOString(),
      contrat_signe_at: null,
      contrat_signatures_done: 0,
      contrat_signatures_total: 2,
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
    usingDefaultTemplate: contractPdf.source === "default",
    contractMerged: contractPdf.source === "merged",
  };
}
