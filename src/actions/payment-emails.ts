"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  automationFromWorkspace,
  eventDashboardUrl,
  paymentPortalUrl,
} from "@/lib/automation-settings";
import { sendEmail } from "@/lib/email/send-email";
import { emailForCouple, emailForDomain } from "@/lib/email/recipients";
import {
  interpolateEmailTemplate,
  paymentConfirmedCoupleEmailHtml,
  paymentConfirmedDomainEmailHtml,
  paymentDeclaredDomainEmailHtml,
  paymentRejectedCoupleEmailHtml,
  paymentRequestEmailHtml,
} from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

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

type PaymentRow = {
  id: string;
  label: string;
  montant: number;
  statut: string;
  payment_request_sent_at: string | null;
};

type EventRow = {
  id: string;
  email: string;
  nom_des_maries: string;
  portal_token: string;
  statut: string;
};

type WorkspaceRow = {
  nom_domaine: string;
  contact_email: string;
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
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

export async function sendPaymentRequestEmail(
  eventId: string,
  paymentId?: string,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const [{ data: workspace }, { data: event }] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).single(),
    supabase
      .from("events")
      .select("id, email, nom_des_maries, portal_token, statut")
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
      error: "L'email paiement s'envoie uniquement sur un dossier engagé.",
    };
  }

  const coupleTo = emailForCouple(event.email);
  if (!coupleTo) {
    return { ok: false, error: "Renseignez l'email du couple sur le dossier." };
  }

  let paymentQuery = supabase
    .from("payments")
    .select("id, label, montant, statut, payment_request_sent_at")
    .eq("event_id", eventId)
    .eq("workspace_id", workspaceId)
    .eq("statut", "en_attente")
    .order("date_echeance", { ascending: true, nullsFirst: false });

  if (paymentId) {
    paymentQuery = paymentQuery.eq("id", paymentId);
  }

  const { data: payments } = await paymentQuery.limit(1);
  const payment = payments?.[0] as PaymentRow | undefined;

  if (!payment) {
    return { ok: false, error: "Aucune échéance en attente à envoyer." };
  }

  const settings = automationFromWorkspace(workspace);
  const vars = buildTemplateVars(
    workspace as WorkspaceRow,
    event as EventRow,
    payment,
  );

  const subject = interpolateEmailTemplate(settings.email_paiement_objet, vars);
  const intro = interpolateEmailTemplate(settings.email_paiement_intro, vars);
  const html = paymentRequestEmailHtml(vars, intro);

  const result = await sendEmail({
    to: coupleTo,
    subject,
    html,
    replyTo: workspace.contact_email || undefined,
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

export async function notifyPaymentConfirmed(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

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
    await sendEmail({
      to: coupleTo,
      subject: `${workspace.nom_domaine} — Paiement enregistré`,
      html: paymentConfirmedCoupleEmailHtml({
        domainName: workspace.nom_domaine,
        coupleName: event.nom_des_maries,
        label: payment.label,
        amount,
      }),
      replyTo: workspace.contact_email || undefined,
    });
  }

  if (domainTo) {
    await sendEmail({
      to: domainTo,
      subject: `Venqor — Paiement reçu · ${event.nom_des_maries}`,
      html: paymentConfirmedDomainEmailHtml({
        domainName: workspace.nom_domaine,
        coupleName: event.nom_des_maries,
        label: payment.label,
        amount,
        eventUrl: eventDashboardUrl(eventId),
      }),
    });
  }
}

export async function notifyPaymentDeclaredFromPortal(
  portalToken: string,
  paymentId: string,
): Promise<void> {
  const supabase = createClient();

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

  await sendEmail({
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
  });
}

export async function notifyPaymentRejected(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

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

  await sendEmail({
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
  });
}

export async function maybeAutoSendPaymentRequest(
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("automation_paiement_active")
    .eq("id", workspaceId)
    .single();

  if (!workspace?.automation_paiement_active) return;

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("event_id", eventId)
    .not("payment_request_sent_at", "is", null)
    .limit(1);

  if ((existing?.length ?? 0) > 0) return;

  await sendPaymentRequestEmail(eventId);
}
