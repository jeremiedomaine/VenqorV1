import type { Workspace } from "@/lib/types";

export interface PaymentAutomationSettings {
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
}

export const DEFAULT_PAYMENT_EMAIL_SUBJECT =
  "{domaine} — Règlement de votre solde";

export const DEFAULT_PAYMENT_EMAIL_INTRO = `Bonjour {couple},

Votre mariage chez {domaine} approche. Merci de régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.`;

export const DEFAULT_ACOMPTE_EMAIL_SUBJECT =
  "{domaine} — Règlement de votre acompte";

export const DEFAULT_ACOMPTE_EMAIL_INTRO = `Bonjour {couple},

Merci de régler votre {libelle} ({montant}) pour confirmer votre réservation chez {domaine}. Utilisez le lien sécurisé ci-dessous.`;

export interface DepositAutomationSettings {
  automation_acompte_active: boolean;
  acompte_signature_timing: "with_contract" | "after_contract";
  email_acompte_objet: string;
  email_acompte_intro: string;
}

/** Ancien modèle (acompte / date bloquée) — migration 011 */
const LEGACY_PAYMENT_EMAIL_SUBJECT =
  "{domaine} — Règlement de votre échéance";

const LEGACY_PAYMENT_EMAIL_INTRO = `Bonjour {couple},

Votre date est réservée chez {domaine}. Vous pouvez régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.`;

export function normalizeSoldeEmailSettings(
  settings: PaymentAutomationSettings,
): PaymentAutomationSettings {
  let { email_paiement_objet, email_paiement_intro } = settings;

  const subjectLooksLikeAcompte =
    email_paiement_objet.toLowerCase().includes("acompte");
  const introLooksLikeAcompte =
    email_paiement_intro.includes("confirmer votre réservation") ||
    email_paiement_intro.toLowerCase().includes("acompte");

  if (
    email_paiement_objet === LEGACY_PAYMENT_EMAIL_SUBJECT ||
    email_paiement_objet === DEFAULT_ACOMPTE_EMAIL_SUBJECT ||
    subjectLooksLikeAcompte ||
    email_paiement_objet.trim() === ""
  ) {
    email_paiement_objet = DEFAULT_PAYMENT_EMAIL_SUBJECT;
  }

  if (
    email_paiement_intro === LEGACY_PAYMENT_EMAIL_INTRO ||
    email_paiement_intro === DEFAULT_ACOMPTE_EMAIL_INTRO ||
    email_paiement_intro.includes("date est réservée") ||
    introLooksLikeAcompte ||
    email_paiement_intro.trim() === ""
  ) {
    email_paiement_intro = DEFAULT_PAYMENT_EMAIL_INTRO;
  }

  return { ...settings, email_paiement_objet, email_paiement_intro };
}

export const PAYMENT_EMAIL_VARIABLES = [
  { key: "{domaine}", label: "Nom du domaine" },
  { key: "{couple}", label: "Nom du couple" },
  { key: "{montant}", label: "Montant" },
  { key: "{libelle}", label: "Libellé échéance" },
  { key: "{lien_paiement}", label: "Lien page couple" },
  { key: "{contact_domaine}", label: "Email contact domaine" },
] as const;

export function automationFromWorkspace(
  workspace: Pick<
    Workspace,
    | "automation_paiement_active"
    | "email_paiement_objet"
    | "email_paiement_intro"
  >,
): PaymentAutomationSettings {
  return normalizeSoldeEmailSettings({
    automation_paiement_active: workspace.automation_paiement_active ?? true,
    email_paiement_objet:
      workspace.email_paiement_objet ?? DEFAULT_PAYMENT_EMAIL_SUBJECT,
    email_paiement_intro:
      workspace.email_paiement_intro ?? DEFAULT_PAYMENT_EMAIL_INTRO,
  });
}

export function depositAutomationFromWorkspace(
  workspace: Pick<
    Workspace,
    | "automation_acompte_active"
    | "acompte_signature_timing"
    | "email_acompte_objet"
    | "email_acompte_intro"
  >,
): DepositAutomationSettings {
  return {
    automation_acompte_active: workspace.automation_acompte_active ?? true,
    acompte_signature_timing:
      workspace.acompte_signature_timing ?? "after_contract",
    email_acompte_objet:
      workspace.email_acompte_objet?.trim() || DEFAULT_ACOMPTE_EMAIL_SUBJECT,
    email_acompte_intro:
      workspace.email_acompte_intro?.trim() || DEFAULT_ACOMPTE_EMAIL_INTRO,
  };
}

export function portalUrl(portalToken: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${base}/portail/${portalToken}`;
}

export function paymentPortalUrl(
  portalToken: string,
  paymentId?: string,
): string {
  const base = portalUrl(portalToken);
  if (!paymentId) return `${base}/paiement`;
  return `${base}/paiement?e=${paymentId}`;
}

export function eventDashboardUrl(eventId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${base}/evenements/${eventId}`;
}
