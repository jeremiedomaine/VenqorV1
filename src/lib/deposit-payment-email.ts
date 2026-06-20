import type { SupabaseClient } from "@supabase/supabase-js";
import {
  depositAutomationFromWorkspace,
  paymentPortalUrl,
} from "@/lib/automation-settings";
import { billingFromWorkspace } from "@/lib/billing";
import { sendEmail } from "@/lib/email/send-email";
import { emailForCouple } from "@/lib/email/recipients";
import {
  interpolateEmailTemplate,
  depositRequestEmailHtml,
} from "@/lib/email/templates";
import { pickAcomptePayment, type PaymentPickRow } from "@/lib/payment-schedule";
import { formatCurrency } from "@/lib/utils";

type PaymentRow = PaymentPickRow & {
  payment_request_sent_at: string | null;
};

export type SendDepositPaymentResult = {
  ok: boolean;
  skipped?: boolean;
  alreadySent?: boolean;
  error?: string;
  reason?: string;
};

export async function sendDepositPaymentRequest(params: {
  supabase: SupabaseClient;
  eventId: string;
  workspaceId: string;
  /** Ignore automation_acompte_active (bouton manuel). */
  manual?: boolean;
  paymentId?: string;
}): Promise<SendDepositPaymentResult> {
  const { supabase, eventId, workspaceId, manual, paymentId } = params;

  const [{ data: workspace }, { data: event }] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).single(),
    supabase
      .from("events")
      .select("id, email, nom_des_maries, portal_token, statut, archived_at, cloture_at")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  if (!workspace || !event) {
    return { ok: false, error: "Dossier introuvable." };
  }

  if (event.archived_at || event.cloture_at) {
    return { ok: false, error: "Dossier archivé ou clôturé." };
  }

  if (event.statut !== "option") {
    return {
      ok: false,
      error: "L'email acompte s'envoie sur un dossier en date bloquée.",
    };
  }

  const depositSettings = depositAutomationFromWorkspace(workspace);

  if (!manual && !depositSettings.automation_acompte_active) {
    return {
      ok: true,
      skipped: true,
      reason: "L'envoi automatique de l'acompte est désactivé dans Automatisations.",
    };
  }

  const coupleTo = emailForCouple(event.email);
  if (!coupleTo) {
    return { ok: false, error: "Renseignez l'email du couple sur le dossier." };
  }

  const billing = billingFromWorkspace(workspace);
  let payment: PaymentRow | undefined;

  if (paymentId) {
    const { data } = await supabase
      .from("payments")
      .select("id, label, montant, statut, payment_request_sent_at")
      .eq("id", paymentId)
      .eq("event_id", eventId)
      .eq("workspace_id", workspaceId)
      .eq("statut", "en_attente")
      .maybeSingle();
    payment = data as PaymentRow | undefined;
  } else {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, label, montant, statut, payment_request_sent_at, date_echeance")
      .eq("event_id", eventId)
      .eq("workspace_id", workspaceId);

    payment = pickAcomptePayment(
      (payments ?? []) as PaymentRow[],
      billing.facturation_acompte_label,
    );
  }

  if (!payment) {
    return {
      ok: false,
      error: "Aucun acompte en attente à envoyer.",
      reason:
        "Générez l'échéancier (prix total > 0) ou vérifiez que l'acompte n'est pas déjà payé.",
    };
  }

  if (payment.payment_request_sent_at) {
    return {
      ok: true,
      alreadySent: true,
      skipped: true,
      reason: "L'email acompte a déjà été envoyé pour cette échéance.",
    };
  }

  const vars = {
    domaine: workspace.nom_domaine,
    couple: event.nom_des_maries,
    montant: formatCurrency(Number(payment.montant)),
    libelle: payment.label,
    lien_paiement: paymentPortalUrl(event.portal_token, payment.id),
    contact_domaine: workspace.contact_email,
  };

  const subject = interpolateEmailTemplate(
    depositSettings.email_acompte_objet,
    vars,
  );
  const intro = interpolateEmailTemplate(depositSettings.email_acompte_intro, vars);
  const html = depositRequestEmailHtml(vars, intro, {
    title: depositSettings.email_acompte_titre,
    ctaLabel: depositSettings.email_acompte_cta,
    footerNote: depositSettings.email_acompte_details,
  });

  const sendResult = await sendEmail({
    to: coupleTo,
    subject,
    html,
    replyTo: workspace.contact_email || undefined,
  });

  if (!sendResult.ok) {
    return { ok: false, error: sendResult.error };
  }

  if (!sendResult.skipped) {
    await supabase
      .from("payments")
      .update({ payment_request_sent_at: new Date().toISOString() })
      .eq("id", payment.id)
      .eq("workspace_id", workspaceId);
  }

  return { ok: true, skipped: sendResult.skipped };
}

export async function maybeSendDepositAfterContract(params: {
  supabase: SupabaseClient;
  eventId: string;
  workspaceId: string;
  timing: "with_contract" | "after_contract";
}): Promise<SendDepositPaymentResult> {
  const { data: workspace } = await params.supabase
    .from("workspaces")
    .select(
      "automation_acompte_active, acompte_signature_timing, email_acompte_objet, email_acompte_intro, email_acompte_titre, email_acompte_cta, email_acompte_details",
    )
    .eq("id", params.workspaceId)
    .single();

  if (!workspace) {
    return { ok: false, error: "Workspace introuvable." };
  }

  const settings = depositAutomationFromWorkspace(workspace);
  if (settings.acompte_signature_timing !== params.timing) {
    return {
      ok: true,
      skipped: true,
      reason:
        params.timing === "with_contract"
          ? "Timing réglé sur « après signature » dans Automatisations."
          : "Timing réglé sur « en même temps que le contrat ».",
    };
  }

  return sendDepositPaymentRequest({
    supabase: params.supabase,
    eventId: params.eventId,
    workspaceId: params.workspaceId,
  });
}
