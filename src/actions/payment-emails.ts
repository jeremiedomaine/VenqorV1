"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceClient } from "@/lib/workspace-session";
import {
  automationFromWorkspace,
  eventDashboardUrl,
  normalizeSoldeEmailSettings,
  paymentPortalUrl,
} from "@/lib/automation-settings";
import { getEventCopy } from "@/lib/event-copy";
import { billingFromWorkspace } from "@/lib/billing";
import { sendTrackedEmail } from "@/lib/email/send-tracked-email";
import { createServiceClient } from "@/lib/supabase/service";
import { emailForCouple, emailForDomain } from "@/lib/email/recipients";
import {
  interpolateEmailTemplate,
  paymentConfirmedCoupleEmailHtml,
  paymentConfirmedDomainEmailHtml,
  paymentDeclaredDomainEmailHtml,
  paymentRejectedCoupleEmailHtml,
  paymentRequestEmailHtml,
} from "@/lib/email/templates";
import {
  isWithinSoldeWindow,
  pickSoldePayment,
  soldeWindowDaysFromWorkspace,
} from "@/lib/payment-schedule";
import { formatCurrency } from "@/lib/utils";
import { sendDepositPaymentRequest } from "@/lib/deposit-payment-email";

type PaymentRow = {
  id: string;
  label: string;
  montant: number;
  statut: string;
  date_echeance?: string | null;
  payment_request_sent_at: string | null;
};

type EventRow = {
  id: string;
  email: string;
  nom_des_maries: string;
  portal_token: string;
  statut: string;
  date_debut: string | null;
  type_evenement: string;
};

type WorkspaceRow = {
  nom_domaine: string;
  contact_email: string;
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
  facturation_solde_label: string;
  facturation_solde_jours: number;
};

function buildTemplateVars(
  workspace: WorkspaceRow,
  event: EventRow,
  payment: PaymentRow,
) {
  return {
    domaine: workspace.nom_domaine,
    couple: event.nom_des_maries,
    montant: formatCurrency(Number(payment.montant)),
    libelle: payment.label,
    lien_paiement: paymentPortalUrl(event.portal_token, payment.id),
    contact_domaine: workspace.contact_email,
  };
}

/** Demande de paiement manuelle — cible le solde (J-30), pas l'acompte. */
export async function sendPaymentRequestEmail(
  eventId: string,
  paymentId?: string,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const [{ data: workspace }, { data: event }] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).single(),
    supabase
      .from("events")
      .select("id, email, nom_des_maries, portal_token, statut, date_debut, type_evenement")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  if (!workspace || !event) {
    return { ok: false, error: "Dossier introuvable." };
  }

  if (!["option", "confirme"].includes(event.statut)) {
    return {
      ok: false,
      error: "L'email solde s'envoie uniquement sur un dossier engagé.",
    };
  }

  const windowDays = soldeWindowDaysFromWorkspace(workspace);
  const copy = getEventCopy(event.type_evenement ?? "mariage");

  if (
    !paymentId &&
    !isWithinSoldeWindow(event.date_debut, windowDays)
  ) {
    return {
      ok: false,
      error: copy.soldeEmailWindow(windowDays),
    };
  }

  const coupleTo = emailForCouple(event.email);
  if (!coupleTo) {
    return { ok: false, error: copy.missingClientEmail };
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

    payment = pickSoldePayment(
      payments ?? [],
      billing.facturation_solde_label,
    ) as PaymentRow | undefined;
  }

  if (!payment) {
    return { ok: false, error: "Aucun solde en attente à envoyer." };
  }

  const settings = normalizeSoldeEmailSettings(
    automationFromWorkspace(workspace),
  );
  const vars = buildTemplateVars(
    workspace as WorkspaceRow,
    event as EventRow,
    payment,
  );

  const subject = interpolateEmailTemplate(settings.email_paiement_objet, vars);
  const intro = interpolateEmailTemplate(settings.email_paiement_intro, vars);
  const html = paymentRequestEmailHtml(vars, intro, {
    title: settings.email_paiement_titre,
    ctaLabel: settings.email_paiement_cta,
    footerNote: settings.email_paiement_details,
  });

  const result = await sendTrackedEmail({
    to: coupleTo,
    subject,
    html,
    replyTo: workspace.contact_email || undefined,
    category: "solde_request",
    workspaceId,
    eventId,
    paymentId: payment.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (!result.skipped) {
    await supabase
      .from("payments")
      .update({ payment_request_sent_at: new Date().toISOString() })
      .eq("id", payment.id)
      .eq("workspace_id", workspaceId);
  }

  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/automatisations");
  return { ok: true, skipped: result.skipped };
}

/** Demande de paiement manuelle — cible l'acompte. */
export async function sendDepositPaymentRequestEmail(
  eventId: string,
  paymentId?: string,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const result = await sendDepositPaymentRequest({
    supabase,
    eventId,
    workspaceId,
    manual: true,
    paymentId,
  });

  if (result.alreadySent) {
    return { ok: false, error: "L'email acompte a déjà été envoyé." };
  }

  if (result.error) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/automatisations");
  return { ok: true, skipped: result.skipped };
}

export async function notifyPaymentConfirmed(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, label, montant")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!payment) return;

  const [{ data: workspace }, { data: event }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("nom_domaine, contact_email")
      .eq("id", workspaceId)
      .single(),
    supabase
      .from("events")
      .select("email, nom_des_maries")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  if (!workspace || !event) return;

  const amount = formatCurrency(Number(payment.montant));
  const coupleTo = emailForCouple(event.email);
  const domainTo = emailForDomain(workspace.contact_email);

  if (coupleTo) {
    await sendTrackedEmail({
      to: coupleTo,
      subject: `${workspace.nom_domaine} — Paiement enregistré`,
      html: paymentConfirmedCoupleEmailHtml({
        domainName: workspace.nom_domaine,
        coupleName: event.nom_des_maries,
        label: payment.label,
        amount,
      }),
      replyTo: workspace.contact_email || undefined,
      category: "payment_confirmed_couple",
      workspaceId,
      eventId,
      paymentId,
      idempotencyKey: `payment_confirmed_couple:${paymentId}`,
    });
  }

  if (domainTo) {
    await sendTrackedEmail({
      to: domainTo,
      subject: `Venqor — Paiement reçu · ${event.nom_des_maries}`,
      html: paymentConfirmedDomainEmailHtml({
        domainName: workspace.nom_domaine,
        coupleName: event.nom_des_maries,
        label: payment.label,
        amount,
        eventUrl: eventDashboardUrl(eventId),
      }),
      category: "payment_confirmed_domain",
      workspaceId,
      eventId,
      paymentId,
      idempotencyKey: `payment_confirmed_domain:${paymentId}`,
    });
  }
}

export async function notifyPaymentDeclaredFromPortal(
  portalToken: string,
  paymentId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, nom_des_maries, workspace_id")
    .eq("portal_token", portalToken)
    .in("statut", ["option", "confirme"])
    .single();

  if (!event) return;

  const { data: payment } = await supabase
    .from("payments")
    .select("id, label, montant")
    .eq("id", paymentId)
    .eq("event_id", event.id)
    .eq("statut", "declare_paye")
    .single();

  if (!payment) return;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine, contact_email")
    .eq("id", event.workspace_id)
    .single();

  if (!workspace) return;

  const domainTo = emailForDomain(workspace.contact_email);
  if (!domainTo) return;

  const amount = formatCurrency(Number(payment.montant));

  await sendTrackedEmail({
    to: domainTo,
    subject: `Venqor — Paiement déclaré · ${event.nom_des_maries}`,
    html: paymentDeclaredDomainEmailHtml({
      domainName: workspace.nom_domaine,
      coupleName: event.nom_des_maries,
      label: payment.label,
      amount,
      eventUrl: eventDashboardUrl(event.id),
    }),
    replyTo: workspace.contact_email || undefined,
    category: "payment_declared_domain",
    workspaceId: event.workspace_id,
    eventId: event.id,
    paymentId,
    idempotencyKey: `payment_declared_domain:${paymentId}`,
  });
}

export async function notifyPaymentRejected(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, label, montant")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!payment) return;

  const [{ data: workspace }, { data: event }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("nom_domaine, contact_email")
      .eq("id", workspaceId)
      .single(),
    supabase
      .from("events")
      .select("email, nom_des_maries, portal_token")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  if (!workspace || !event) return;

  const coupleTo = emailForCouple(event.email);
  if (!coupleTo) return;

  const amount = formatCurrency(Number(payment.montant));

  await sendTrackedEmail({
    to: coupleTo,
    subject: `${workspace.nom_domaine} — Virement non reçu`,
    html: paymentRejectedCoupleEmailHtml({
      domainName: workspace.nom_domaine,
      coupleName: event.nom_des_maries,
      label: payment.label,
      amount,
      portalUrl: paymentPortalUrl(event.portal_token, paymentId),
    }),
    replyTo: workspace.contact_email || undefined,
    category: "payment_rejected_couple",
    workspaceId,
    eventId,
    paymentId,
    idempotencyKey: `payment_rejected_couple:${paymentId}`,
  });
}
