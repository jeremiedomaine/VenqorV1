"use server";

import { createClient } from "@/lib/supabase/server";
import { emailForTestPreview } from "@/lib/email/recipients";
import { sendEmail } from "@/lib/email/send-email";
import {
  depositRequestEmailHtml,
  interpolateEmailTemplate,
  paymentRequestEmailHtml,
  relanceEmailHtml,
} from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

async function getWorkspaceContext() {
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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine, contact_email")
    .eq("id", profile.workspace_id)
    .single();
  if (!workspace) throw new Error("Workspace introuvable");

  return workspace;
}

const DEMO_VARS = {
  domaine: "Domaine Les Chênes",
  couple: "Alice & Martin",
  montant: formatCurrency(1500),
  libelle: "Acompte",
  lien_paiement: "https://app.venqor.app/portail/exemple/paiement",
  contact_domaine: "contact@domaine.fr",
  date_echeance: "15 septembre 2026",
  delai_jours: "7",
};

export async function sendAutomationTestEmail(
  formData: FormData,
): Promise<{ error?: string; sentTo?: string }> {
  const workspace = await getWorkspaceContext();
  const to = emailForTestPreview(workspace.contact_email);
  if (!to) {
    return {
      error:
        "Renseignez l'email de contact du domaine dans Paramètres pour recevoir le test.",
    };
  }

  const kind = String(formData.get("kind") ?? "");
  const domaine = workspace.nom_domaine;
  const vars = { ...DEMO_VARS, domaine, contact_domaine: workspace.contact_email };

  let subject = "";
  let html = "";

  if (kind === "payment_acompte" || kind === "payment_solde") {
    const title = String(formData.get("email_titre") ?? "").trim();
    const emailSubject = String(formData.get("email_objet") ?? "").trim();
    const intro = String(formData.get("email_intro") ?? "").trim();
    const ctaLabel = String(formData.get("email_cta_label") ?? "").trim();
    const details = String(formData.get("email_footer_note") ?? "").trim();

    if (!title || !emailSubject || !intro || !ctaLabel) {
      return { error: "Complétez le titre, l'objet, le message et le bouton." };
    }

    const previewVars =
      kind === "payment_solde"
        ? { ...vars, montant: formatCurrency(3500), libelle: "Solde" }
        : vars;

    subject = `[Test Venqor] ${interpolateEmailTemplate(emailSubject, previewVars)}`;
    html =
      kind === "payment_acompte"
        ? depositRequestEmailHtml(
            previewVars,
            interpolateEmailTemplate(intro, previewVars),
            { title, ctaLabel, footerNote: details },
          )
        : paymentRequestEmailHtml(
            previewVars,
            interpolateEmailTemplate(intro, previewVars),
            { title, ctaLabel, footerNote: details },
          );
  } else if (kind === "relance") {
    const title = String(formData.get("email_titre") ?? "").trim();
    const emailSubject = String(formData.get("email_objet") ?? "").trim();
    const intro = String(formData.get("email_intro") ?? "").trim();
    const ctaLabel = String(formData.get("email_cta_label") ?? "").trim();
    const details = String(formData.get("email_footer_note") ?? "").trim();
    const declencheur = String(formData.get("declencheur") ?? "");

    if (!title || !emailSubject || !intro || !ctaLabel) {
      return { error: "Complétez le titre, l'objet, le message et le bouton." };
    }

    subject = `[Test Venqor] ${interpolateEmailTemplate(emailSubject, vars)}`;
    html = relanceEmailHtml({
      domainName: domaine,
      title,
      introText: interpolateEmailTemplate(intro, vars),
      ctaLabel,
      ctaHref: vars.lien_paiement,
      footerNote: details || undefined,
      paymentRelated: declencheur !== "contrat_jours_apres",
    });
  } else {
    return { error: "Type d'email test inconnu." };
  }

  const result = await sendEmail({
    to,
    subject,
    html,
    replyTo: workspace.contact_email || undefined,
  });

  if (!result.ok) {
    return { error: result.error ?? "Envoi impossible." };
  }

  if (result.skipped) {
    return {
      sentTo: to,
      error:
        "Email simulé (RESEND non configuré en local). Vérifiez les logs serveur.",
    };
  }

  return { sentTo: to };
}
