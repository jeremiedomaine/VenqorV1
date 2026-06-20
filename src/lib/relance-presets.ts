export type RelanceCible = "couple" | "domaine";

export type RelanceDeclencheur =
  | "echeance_jours_avant"
  | "echeance_jours_apres"
  | "contrat_jours_apres";

export type RelancePresetKey =
  | "couple_rappel_echeance"
  | "couple_relance_impaye"
  | "domaine_paiement_retard"
  | "couple_contrat_relance";

export interface RelanceRegle {
  id: string;
  workspace_id: string;
  preset_key: RelancePresetKey;
  nom: string;
  active: boolean;
  cible: RelanceCible;
  declencheur: RelanceDeclencheur;
  delai_jours: number;
  email_objet: string;
  email_intro: string;
  created_at: string;
  updated_at: string;
}

export interface RelancePresetDefinition {
  preset_key: RelancePresetKey;
  nom: string;
  description: string;
  cible: RelanceCible;
  declencheur: RelanceDeclencheur;
  delai_jours: number;
  default_active: boolean;
  email_objet: string;
  email_intro: string;
  email_title: string;
  cta_label: string;
}

export const RELANCE_EMAIL_VARIABLES = [
  { key: "{domaine}", label: "Nom du domaine" },
  { key: "{couple}", label: "Nom du couple" },
  { key: "{montant}", label: "Montant (si échéance)" },
  { key: "{libelle}", label: "Libellé échéance" },
  { key: "{date_echeance}", label: "Date d'échéance" },
  { key: "{lien_paiement}", label: "Lien page couple / paiement" },
  { key: "{contact_domaine}", label: "Email contact domaine" },
] as const;

export const DEFAULT_RELANCE_PRESETS: RelancePresetDefinition[] = [
  {
    preset_key: "couple_rappel_echeance",
    nom: "Rappel avant échéance",
    description:
      "Rappelle au couple qu'une échéance approche (virement à effectuer).",
    cible: "couple",
    declencheur: "echeance_jours_avant",
    delai_jours: 7,
    default_active: true,
    email_objet: "{domaine} — Rappel : {libelle} à régler",
    email_intro: `Bonjour {couple},

Votre échéance {libelle} ({montant}) pour votre mariage chez {domaine} arrive le {date_echeance}.

Utilisez votre espace couple pour consulter les coordonnées bancaires et déclarer votre virement.`,
    email_title: "Rappel d'échéance",
    cta_label: "Accéder à mon espace",
  },
  {
    preset_key: "couple_relance_impaye",
    nom: "Relance après échéance",
    description:
      "Relance le couple si l'échéance est dépassée et toujours en attente.",
    cible: "couple",
    declencheur: "echeance_jours_apres",
    delai_jours: 3,
    default_active: true,
    email_objet: "{domaine} — Relance : {libelle} ({montant})",
    email_intro: `Bonjour {couple},

Sauf erreur de notre part, votre {libelle} de {montant} n'a pas encore été réglé(e). L'échéance était prévue le {date_echeance}.

Merci de régulariser via votre espace couple ou de nous contacter à {contact_domaine}.`,
    email_title: "Relance de paiement",
    cta_label: "Régler maintenant",
  },
  {
    preset_key: "domaine_paiement_retard",
    nom: "Alerte paiement en retard",
    description:
      "Informe le domaine qu'une échéance couple est en retard (pour relance manuelle ou suivi).",
    cible: "domaine",
    declencheur: "echeance_jours_apres",
    delai_jours: 7,
    default_active: true,
    email_objet: "{domaine} — Échéance en retard : {couple}",
    email_intro: `Bonjour,

L'échéance {libelle} ({montant}) pour {couple} est en retard de {delai_jours} jours (échéance du {date_echeance}).

Consultez le dossier dans Venqor pour relancer le couple si besoin.`,
    email_title: "Paiement en retard",
    cta_label: "Voir le dossier",
  },
  {
    preset_key: "couple_contrat_relance",
    nom: "Relance signature contrat",
    description:
      "Rappelle au couple de signer le contrat Yousign si la signature est toujours en attente.",
    cible: "couple",
    declencheur: "contrat_jours_apres",
    delai_jours: 7,
    default_active: false,
    email_objet: "{domaine} — Rappel : signature de votre contrat",
    email_intro: `Bonjour {couple},

Votre contrat de réservation chez {domaine} est en attente de signature.

Si vous n'avez pas reçu l'email Yousign, vérifiez vos spams ou contactez-nous à {contact_domaine}.`,
    email_title: "Signature du contrat",
    cta_label: "Mon espace couple",
  },
];

export function getRelancePreset(
  presetKey: RelancePresetKey,
): RelancePresetDefinition | undefined {
  return DEFAULT_RELANCE_PRESETS.find((p) => p.preset_key === presetKey);
}
