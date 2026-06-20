export interface EmailTemplateVars {
  domaine: string;
  couple: string;
  montant: string;
  libelle: string;
  lien_paiement: string;
  contact_domaine: string;
  date_echeance?: string;
  delai_jours?: string;
}

export function interpolateEmailTemplate(
  template: string,
  vars: EmailTemplateVars,
): string {
  return template
    .replaceAll("{domaine}", vars.domaine)
    .replaceAll("{couple}", vars.couple)
    .replaceAll("{montant}", vars.montant)
    .replaceAll("{libelle}", vars.libelle)
    .replaceAll("{lien_paiement}", vars.lien_paiement)
    .replaceAll("{contact_domaine}", vars.contact_domaine)
    .replaceAll("{date_echeance}", vars.date_echeance ?? "")
    .replaceAll("{delai_jours}", vars.delai_jours ?? "");
}

export function paragraphsFromText(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

interface VenqorEmailLayoutOptions {
  domainName: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  paymentFooter?: boolean;
}

export function venqorEmailLayout({
  domainName,
  title,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerNote,
  paymentFooter = true,
}: VenqorEmailLayoutOptions): string {
  const ctaBlock =
    ctaLabel && ctaHref
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
          <tr>
            <td style="border-radius:10px;background:#4F46E5;">
              <a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:28px 32px 24px;background:linear-gradient(135deg,#4F46E5 0%,#6366F1 55%,#818CF8 100%);">
                <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.72);">
                  Venqor
                </p>
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;line-height:1.3;">
                  ${escapeHtml(domainName)}
                </h1>
                <p style="margin:10px 0 0;color:rgba(255,255,255,0.82);font-size:13px;">
                  Message envoyé via Venqor pour ${escapeHtml(domainName)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 20px;color:#0f172a;font-size:18px;font-weight:600;">
                  ${escapeHtml(title)}
                </h2>
                ${bodyHtml}
                ${ctaBlock}
                ${footerNote ? `<p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${escapeHtml(footerNote)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 24px;border-top:1px solid #f1f5f9;background:#fafafa;">
                <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;text-align:center;">
                  Propulsé par Venqor · Espace géré par ${escapeHtml(domainName)}<br/>
                  ${paymentFooter ? "Venqor ne émet pas de factures légales." : "Répondez à cet email pour contacter le domaine."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function relanceEmailHtml(options: {
  domainName: string;
  title: string;
  introText: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  paymentRelated?: boolean;
}): string {
  return venqorEmailLayout({
    domainName: options.domainName,
    title: options.title,
    bodyHtml: paragraphsFromText(options.introText),
    ctaLabel: options.ctaLabel,
    ctaHref: options.ctaHref,
    footerNote: options.footerNote,
    paymentFooter: options.paymentRelated ?? true,
  });
}

export function paymentRequestEmailHtml(
  vars: EmailTemplateVars,
  introText: string,
  options?: {
    title?: string;
    ctaLabel?: string;
  },
): string {
  return venqorEmailLayout({
    domainName: vars.domaine,
    title: options?.title ?? "Règlement de votre solde",
    bodyHtml: paragraphsFromText(introText),
    ctaLabel: options?.ctaLabel ?? "Régler mon solde",
    ctaHref: vars.lien_paiement,
    footerNote:
      "Page de paiement sécurisée. Vous y trouverez les coordonnées bancaires et pourrez confirmer votre virement.",
  });
}

export function depositRequestEmailHtml(
  vars: EmailTemplateVars,
  introText: string,
): string {
  return paymentRequestEmailHtml(vars, introText, {
    title: "Règlement de votre acompte",
    ctaLabel: "Régler mon acompte",
  });
}

export function paymentConfirmedCoupleEmailHtml(vars: {
  domainName: string;
  coupleName: string;
  label: string;
  amount: string;
}): string {
  return venqorEmailLayout({
    domainName: vars.domainName,
    title: "Paiement enregistré",
    bodyHtml: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Bonjour ${escapeHtml(vars.coupleName)},<br/><br/>
      Votre paiement <strong>${escapeHtml(vars.label)}</strong> de <strong>${escapeHtml(vars.amount)}</strong>
      a bien été enregistré par ${escapeHtml(vars.domainName)}.
    </p>
    <p style="margin:0;color:#059669;font-size:14px;font-weight:600;">
      ✓ Statut : payé
    </p>`,
  });
}

export function paymentConfirmedDomainEmailHtml(vars: {
  domainName: string;
  coupleName: string;
  label: string;
  amount: string;
  eventUrl: string;
}): string {
  return venqorEmailLayout({
    domainName: vars.domainName,
    title: "Paiement confirmé",
    bodyHtml: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Le paiement <strong>${escapeHtml(vars.label)}</strong> de <strong>${escapeHtml(vars.amount)}</strong>
      pour <strong>${escapeHtml(vars.coupleName)}</strong> est maintenant marqué comme payé dans Venqor.
    </p>`,
    ctaLabel: "Voir le dossier",
    ctaHref: vars.eventUrl,
  });
}

export function paymentDeclaredDomainEmailHtml(vars: {
  domainName: string;
  coupleName: string;
  label: string;
  amount: string;
  eventUrl: string;
}): string {
  return venqorEmailLayout({
    domainName: vars.domainName,
    title: "Paiement déclaré par le couple",
    bodyHtml: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(vars.coupleName)}</strong> indique avoir effectué le virement pour
      <strong>${escapeHtml(vars.label)}</strong> (<strong>${escapeHtml(vars.amount)}</strong>).
    </p>
    <p style="margin:0;color:#0369a1;font-size:14px;font-weight:600;">
      À confirmer — vérifiez votre compte bancaire puis validez ou rejetez dans Venqor.
    </p>`,
    ctaLabel: "Confirmer dans Venqor",
    ctaHref: vars.eventUrl,
    footerNote:
      "Ce message ne confirme pas la réception du virement sur votre compte.",
  });
}

export function paymentRejectedCoupleEmailHtml(vars: {
  domainName: string;
  coupleName: string;
  label: string;
  amount: string;
  portalUrl: string;
}): string {
  return venqorEmailLayout({
    domainName: vars.domainName,
    title: "Paiement non reçu",
    bodyHtml: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      Bonjour ${escapeHtml(vars.coupleName)},<br/><br/>
      ${escapeHtml(vars.domainName)} n'a pas encore reçu votre virement pour
      <strong>${escapeHtml(vars.label)}</strong> (<strong>${escapeHtml(vars.amount)}</strong>).
    </p>
    <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">
      Vérifiez que le virement a bien été envoyé avec la bonne référence, ou contactez le domaine.
    </p>`,
    ctaLabel: "Retourner à mon espace paiement",
    ctaHref: vars.portalUrl,
  });
}
