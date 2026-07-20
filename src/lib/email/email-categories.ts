export type EmailCategory =
  | "acompte_request"
  | "solde_request"
  | "payment_declared_domain"
  | "payment_confirmed_couple"
  | "payment_confirmed_domain"
  | "payment_rejected_couple"
  | "relance"
  | "automation_test"
  | "caution_swikly"
  | "caution_edl";

export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  acompte_request: "Demande d'acompte",
  solde_request: "Demande de solde",
  payment_declared_domain: "Déclaration de virement",
  payment_confirmed_couple: "Confirmation client",
  payment_confirmed_domain: "Confirmation domaine",
  payment_rejected_couple: "Virement non reçu",
  relance: "Relance automatique",
  automation_test: "Email test",
  caution_swikly: "Caution Swikly",
  caution_edl: "État des lieux vidéo",
};
