import { paragraphsFromText, venqorEmailLayout } from "@/lib/email/templates";
import { formatCurrency, formatDate } from "@/lib/utils";

export function buildSwiklyCautionEmailHtml(input: {
  domainName: string;
  couple: string;
  amount: number;
  arrivalDate: string;
  swiklyUrl: string;
}): string {
  const body = paragraphsFromText(
    [
      `Bonjour ${input.couple},`,
      `Dans le cadre de votre séjour chez ${input.domainName} (arrivée le ${formatDate(input.arrivalDate)}), nous vous demandons une empreinte bancaire de caution de ${formatCurrency(input.amount)}.`,
      `Aucun montant n'est débité : il s'agit uniquement d'une vérification / blocage temporaire (Swikly), pour remplacer le chèque de caution.`,
      `Merci de valider votre empreinte via le bouton ci-dessous, idéalement avant votre arrivée.`,
    ].join("\n\n"),
  );

  return venqorEmailLayout({
    domainName: input.domainName,
    title: `Empreinte de caution ${formatCurrency(input.amount)}`,
    bodyHtml: body,
    ctaLabel: "Valider mon empreinte",
    ctaHref: input.swiklyUrl,
    footerNote:
      "En cas de question, répondez à cet email pour contacter le domaine.",
    paymentFooter: false,
  });
}

export function buildEdlCoupleEmailHtml(input: {
  domainName: string;
  couple: string;
  kind: "entree" | "sortie";
  fileName?: string;
  downloadUrl?: string;
}): string {
  const label =
    input.kind === "entree"
      ? "d'entrée (vendredi)"
      : "de sortie (dimanche)";

  const body = paragraphsFromText(
    [
      `Bonjour ${input.couple},`,
      `${input.domainName} a enregistré l'état des lieux vidéo ${label} de votre séjour.`,
      input.fileName
        ? `Fichier : ${input.fileName}`
        : "La vidéo est conservée comme preuve par le domaine.",
      `Cette vidéo sert de preuve partagée (comme pour une location de voiture) afin d'éviter tout litige après le week-end.`,
      input.downloadUrl
        ? `Vous pouvez télécharger la vidéo via le bouton ci-dessous (lien valable 30 jours). Conservez-la précieusement.`
        : `Conservez cet email. Le domaine peut vous renvoyer la vidéo sur demande.`,
    ].join("\n\n"),
  );

  return venqorEmailLayout({
    domainName: input.domainName,
    title: `État des lieux ${label}`,
    bodyHtml: body,
    ctaLabel: input.downloadUrl ? "Télécharger la vidéo" : undefined,
    ctaHref: input.downloadUrl,
    footerNote:
      "Message automatique Venqor Caution — ne pas répondre pour une urgence le jour J, contactez directement le domaine.",
    paymentFooter: false,
  });
}
