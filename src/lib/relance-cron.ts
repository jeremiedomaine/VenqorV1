import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import {
  eventDashboardUrl,
  paymentPortalUrl,
  portalUrl,
} from "@/lib/automation-settings";
import { sendEmail } from "@/lib/email/send-email";
import { emailForCouple, emailForDomain } from "@/lib/email/recipients";
import {
  interpolateEmailTemplate,
  relanceEmailHtml,
} from "@/lib/email/templates";
import { eventMatchesRelanceFilters } from "@/lib/relance-filters";
import {
  relanceEmailContent,
  type RelanceDeclencheur,
  type RelanceRegle,
} from "@/lib/relance-presets";
import { createServiceClient } from "@/lib/supabase/service";
import { formatCurrency, formatDate } from "@/lib/utils";

export type RelanceCronResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

type WorkspaceRow = {
  id: string;
  nom_domaine: string;
  contact_email: string;
  relances_actives: boolean;
};

type EventRow = {
  id: string;
  email: string;
  nom_des_maries: string;
  portal_token: string;
  contrat_statut: string;
  contrat_envoye_at: string | null;
  type_evenement: string;
  statut: string;
};

type PaymentRow = {
  id: string;
  label: string;
  montant: number;
  statut: string;
  date_echeance: string | null;
};

function todayStart(): Date {
  return startOfDay(new Date());
}

function dayOffsetFromToday(dateStr: string): number {
  return differenceInCalendarDays(startOfDay(parseISO(dateStr)), todayStart());
}

function daysSince(isoTimestamp: string): number {
  const datePart = isoTimestamp.slice(0, 10);
  return differenceInCalendarDays(todayStart(), startOfDay(parseISO(datePart)));
}

function paymentMatchesDeclencheur(
  declencheur: RelanceDeclencheur,
  delaiJours: number,
  payment: PaymentRow,
): boolean {
  if (!payment.date_echeance) return false;

  const offset = dayOffsetFromToday(payment.date_echeance);

  if (declencheur === "echeance_jours_avant") {
    return payment.statut === "en_attente" && offset === delaiJours;
  }

  if (declencheur === "echeance_jours_apres") {
    return (
      (payment.statut === "en_attente" || payment.statut === "declare_paye") &&
      offset === -delaiJours
    );
  }

  return false;
}

async function wasAlreadySent(
  supabase: ReturnType<typeof createServiceClient>,
  ruleId: string,
  eventId: string,
  paymentId: string | null,
): Promise<boolean> {
  let query = supabase
    .from("relance_envois")
    .select("id")
    .eq("relance_regle_id", ruleId)
    .eq("event_id", eventId);

  if (paymentId) {
    query = query.eq("payment_id", paymentId);
  } else {
    query = query.is("payment_id", null);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function logSend(
  supabase: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  ruleId: string,
  eventId: string,
  paymentId: string | null,
): Promise<void> {
  await supabase.from("relance_envois").insert({
    workspace_id: workspaceId,
    relance_regle_id: ruleId,
    event_id: eventId,
    payment_id: paymentId,
  });
}

export async function processRelanceEmails(): Promise<RelanceCronResult> {
  const supabase = createServiceClient();
  const result: RelanceCronResult = { sent: 0, skipped: 0, errors: [] };

  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id, nom_domaine, contact_email, relances_actives")
    .eq("relances_actives", true);

  if (wsError) {
    result.errors.push(wsError.message);
    return result;
  }

  for (const workspace of (workspaces ?? []) as WorkspaceRow[]) {
    const { data: rules, error: rulesError } = await supabase
      .from("relance_regles")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("active", true);

    if (rulesError) {
      result.errors.push(rulesError.message);
      continue;
    }

    const activeRules = (rules ?? []) as RelanceRegle[];
    if (!activeRules.length) continue;

    const { data: events, error: evError } = await supabase
      .from("events")
      .select(
        "id, email, nom_des_maries, portal_token, contrat_statut, contrat_envoye_at, type_evenement, statut",
      )
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .is("cloture_at", null);

    if (evError) {
      result.errors.push(evError.message);
      continue;
    }

    for (const event of (events ?? []) as EventRow[]) {
      for (const rule of activeRules) {
        if (!eventMatchesRelanceFilters(event, rule)) {
          result.skipped += 1;
          continue;
        }

        if (rule.declencheur === "contrat_jours_apres") {
          if (
            event.contrat_statut !== "en_cours" ||
            !event.contrat_envoye_at ||
            daysSince(event.contrat_envoye_at) !== rule.delai_jours
          ) {
            result.skipped += 1;
            continue;
          }

          if (await wasAlreadySent(supabase, rule.id, event.id, null)) {
            result.skipped += 1;
            continue;
          }

          const emailContent = relanceEmailContent(rule);
          const portalLink = portalUrl(event.portal_token);
          const vars = {
            domaine: workspace.nom_domaine,
            couple: event.nom_des_maries,
            montant: "",
            libelle: "",
            lien_paiement: portalLink,
            contact_domaine: workspace.contact_email,
            date_echeance: "",
            delai_jours: String(rule.delai_jours),
          };

          const to = emailForCouple(event.email);
          if (!to) {
            result.skipped += 1;
            continue;
          }

          const sendResult = await sendEmail({
            to,
            subject: interpolateEmailTemplate(rule.email_objet, vars),
            html: relanceEmailHtml({
              domainName: workspace.nom_domaine,
              title: emailContent.title,
              introText: interpolateEmailTemplate(rule.email_intro, vars),
              ctaLabel: emailContent.ctaLabel,
              ctaHref: portalLink,
              paymentRelated: false,
              footerNote: emailContent.footerNote,
            }),
            replyTo: workspace.contact_email || undefined,
          });

          if (!sendResult.ok) {
            result.errors.push(sendResult.error ?? `Relance ${rule.id}`);
            continue;
          }

          if (!sendResult.skipped) {
            await logSend(supabase, workspace.id, rule.id, event.id, null);
          }
          result.sent += 1;
          continue;
        }

        if (
          rule.declencheur !== "echeance_jours_avant" &&
          rule.declencheur !== "echeance_jours_apres"
        ) {
          continue;
        }

        const { data: payments, error: payError } = await supabase
          .from("payments")
          .select("id, label, montant, statut, date_echeance")
          .eq("event_id", event.id)
          .eq("workspace_id", workspace.id);

        if (payError) {
          result.errors.push(payError.message);
          continue;
        }

        for (const payment of (payments ?? []) as PaymentRow[]) {
          if (
            !paymentMatchesDeclencheur(
              rule.declencheur,
              rule.delai_jours,
              payment,
            )
          ) {
            result.skipped += 1;
            continue;
          }

          if (await wasAlreadySent(supabase, rule.id, event.id, payment.id)) {
            result.skipped += 1;
            continue;
          }

          const emailContent = relanceEmailContent(rule);
          const paymentLink = paymentPortalUrl(event.portal_token, payment.id);
          const eventLink = eventDashboardUrl(event.id);
          const formattedDate = payment.date_echeance
            ? formatDate(payment.date_echeance)
            : "";

          const vars = {
            domaine: workspace.nom_domaine,
            couple: event.nom_des_maries,
            montant: formatCurrency(Number(payment.montant)),
            libelle: payment.label,
            lien_paiement:
              rule.cible === "domaine" ? eventLink : paymentLink,
            contact_domaine: workspace.contact_email,
            date_echeance: formattedDate,
            delai_jours: String(rule.delai_jours),
          };

          const to =
            rule.cible === "domaine"
              ? emailForDomain(workspace.contact_email)
              : emailForCouple(event.email);

          if (!to) {
            result.skipped += 1;
            continue;
          }

          const sendResult = await sendEmail({
            to,
            subject: interpolateEmailTemplate(rule.email_objet, vars),
            html: relanceEmailHtml({
              domainName: workspace.nom_domaine,
              title: emailContent.title,
              introText: interpolateEmailTemplate(rule.email_intro, vars),
              ctaLabel: emailContent.ctaLabel,
              ctaHref: vars.lien_paiement,
              footerNote:
                emailContent.footerNote ??
                (rule.cible === "couple"
                  ? "Page client sécurisée — coordonnées bancaires et déclaration de virement."
                  : undefined),
              paymentRelated: true,
            }),
            replyTo: workspace.contact_email || undefined,
          });

          if (!sendResult.ok) {
            result.errors.push(sendResult.error ?? `Relance ${rule.id}`);
            continue;
          }

          if (!sendResult.skipped) {
            await logSend(
              supabase,
              workspace.id,
              rule.id,
              event.id,
              payment.id,
            );
          }
          result.sent += 1;
        }
      }
    }
  }

  return result;
}
