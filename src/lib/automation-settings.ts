import type { Workspace } from "@/lib/types";

export interface PaymentAutomationSettings {
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
}

export const DEFAULT_PAYMENT_EMAIL_SUBJECT =
  "{domaine} — Règlement de votre échéance";

export const DEFAULT_PAYMENT_EMAIL_INTRO = `Bonjour {couple},

Votre date est réservée chez {domaine}. Vous pouvez régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.`;

export const PAYMENT_EMAIL_VARIABLES = [
  { key: "{domaine}", label: "Nom du domaine" },
  { key: "{couple}", label: "Nom du couple" },
  { key: "{montant}", label: "Montant" },
  { key: "{libelle}", label: "Libellé échéance" },
  { key: "{lien_paiement}", label: "Lien page couple" },
  { key: "{contact_domaine}", label: "Email contact domaine" },
] as const;

export function automationFromWorkspace(
  workspace: Workspace,
): PaymentAutomationSettings {
  return {
    automation_paiement_active: workspace.automation_paiement_active ?? true,
    email_paiement_objet:
      workspace.email_paiement_objet ?? DEFAULT_PAYMENT_EMAIL_SUBJECT,
    email_paiement_intro:
      workspace.email_paiement_intro ?? DEFAULT_PAYMENT_EMAIL_INTRO,
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
