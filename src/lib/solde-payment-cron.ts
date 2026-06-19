import {
  automationFromWorkspace,
  paymentPortalUrl,
} from "@/lib/automation-settings";
import { billingFromWorkspace } from "@/lib/billing";
import { sendEmail } from "@/lib/email/send-email";
import { emailForCouple } from "@/lib/email/recipients";
import {
  interpolateEmailTemplate,
  paymentRequestEmailHtml,
} from "@/lib/email/templates";
import {
  isWithinSoldeWindow,
  pickSoldePayment,
  soldeWindowDaysFromWorkspace,
} from "@/lib/payment-schedule";
import { createServiceClient } from "@/lib/supabase/service";
import { formatCurrency } from "@/lib/utils";

export type SoldeCronResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

type WorkspaceRow = {
  id: string;
  nom_domaine: string;
  contact_email: string;
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
  facturation_solde_label: string;
  facturation_solde_jours: number;
};

type EventRow = {
  id: string;
  email: string;
  nom_des_maries: string;
  portal_token: string;
  date_debut: string;
};

type PaymentRow = {
  id: string;
  label: string;
  montant: number;
  statut: string;
  date_echeance: string | null;
  payment_request_sent_at: string | null;
};

export async function processSoldePaymentRequests(): Promise<SoldeCronResult> {
  const supabase = createServiceClient();
  const result: SoldeCronResult = { sent: 0, skipped: 0, errors: [] };

  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select(
      "id, nom_domaine, contact_email, automation_paiement_active, email_paiement_objet, email_paiement_intro, facturation_solde_label, facturation_solde_jours",
    )
    .eq("automation_paiement_active", true);

  if (wsError) {
    result.errors.push(wsError.message);
    return result;
  }

  for (const workspace of (workspaces ?? []) as WorkspaceRow[]) {
    const billing = billingFromWorkspace(workspace);
    const windowDays = soldeWindowDaysFromWorkspace(workspace);

    const { data: events, error: evError } = await supabase
      .from("events")
      .select("id, email, nom_des_maries, portal_token, date_debut")
      .eq("workspace_id", workspace.id)
      .in("statut", ["option", "confirme"])
      .is("archived_at", null)
      .is("cloture_at", null)
      .not("date_debut", "is", null);

    if (evError) {
      result.errors.push(evError.message);
      continue;
    }

    for (const event of (events ?? []) as EventRow[]) {
      if (!isWithinSoldeWindow(event.date_debut, windowDays)) {
        result.skipped += 1;
        continue;
      }

      const { data: payments, error: payError } = await supabase
        .from("payments")
        .select(
          "id, label, montant, statut, date_echeance, payment_request_sent_at",
        )
        .eq("event_id", event.id)
        .eq("workspace_id", workspace.id);

      if (payError) {
        result.errors.push(payError.message);
        continue;
      }

      const solde = pickSoldePayment(
        (payments ?? []) as PaymentRow[],
        billing.facturation_solde_label,
      );

      if (!solde || solde.payment_request_sent_at) {
        result.skipped += 1;
        continue;
      }

      const coupleTo = emailForCouple(event.email);
      if (!coupleTo) {
        result.skipped += 1;
        continue;
      }

      const settings = automationFromWorkspace(workspace);
      const vars = {
        domaine: workspace.nom_domaine,
        couple: event.nom_des_maries,
        montant: formatCurrency(Number(solde.montant)),
        libelle: solde.label,
        lien_paiement: paymentPortalUrl(event.portal_token, solde.id),
        contact_domaine: workspace.contact_email,
      };

      const subject = interpolateEmailTemplate(settings.email_paiement_objet, vars);
      const intro = interpolateEmailTemplate(settings.email_paiement_intro, vars);
      const html = paymentRequestEmailHtml(vars, intro);

      const sendResult = await sendEmail({
        to: coupleTo,
        subject,
        html,
        replyTo: workspace.contact_email || undefined,
      });

      if (!sendResult.ok) {
        result.errors.push(
          sendResult.error ?? `Envoi impossible pour ${event.id}`,
        );
        continue;
      }

      if (!sendResult.skipped) {
        await supabase
          .from("payments")
          .update({ payment_request_sent_at: new Date().toISOString() })
          .eq("id", solde.id)
          .eq("workspace_id", workspace.id);
      }

      result.sent += 1;
    }
  }

  return result;
}
