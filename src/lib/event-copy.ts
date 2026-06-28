import { isMariageType } from "@/lib/event-types";
import type { EventStatus } from "@/lib/types";

/** Libellés UI pour le statut `prospect` (valeur technique inchangée en base). */
export const DEMANDE_STATUS = {
  singular: "Demande",
  plural: "Demandes",
  singularLower: "demande",
  pluralLower: "demandes",
} as const;

export function eventStatusLabel(
  status: EventStatus,
  form: "singular" | "plural" = "plural",
): string {
  if (status === "prospect") {
    return form === "singular"
      ? DEMANDE_STATUS.singular
      : DEMANDE_STATUS.plural;
  }
  if (status === "option") {
    return form === "singular" ? "Date bloquée" : "Dates bloquées";
  }
  return form === "singular" ? "Confirmé" : "Confirmés";
}

export type EventCopy = {
  clientsSection: string;
  person1: string;
  person2: string;
  clientReference: string;
  clientsReference: string;
  bothSigners: string;
  signerSingular: string;
  eventDate: string;
  eventDateLower: string;
  eventDay: string;
  portalTitle: string;
  portalPageTitle: string;
  portalShareHint: string;
  portalArchivedMessage: string;
  portalClosedMessage: string;
  contractType: string;
  nextConfirmedEvent: string;
  noUpcomingConfirmed: string;
  coordinateHint: string;
  searchPlaceholder: string;
  eventNamePlaceholder: string;
  eventDateBefore: string;
  billingDateLabel: string;
  billingDateHint: string;
  missingClientEmail: string;
  missingClientEmailContract: string;
  soldeEmailWindow: (days: number) => string;
};

const WEDDING_COPY: EventCopy = {
  clientsSection: "Les mariés",
  person1: "Marié(e) 1",
  person2: "Marié(e) 2",
  clientReference: "le couple",
  clientsReference: "les mariés",
  bothSigners: "les deux mariés",
  signerSingular: "marié(e)",
  eventDate: "Date du mariage",
  eventDateLower: "mariage",
  eventDateBefore: "du mariage",
  eventDay: "jour J",
  portalTitle: "Espace mariés",
  portalPageTitle: "Page couple",
  portalShareHint:
    "Partagez-le au couple par email ou message.",
  portalArchivedMessage:
    "Ce dossier a été archivé par le domaine. L'espace couple n'est plus accessible.",
  portalClosedMessage:
    "Ce mariage est clôturé. L'espace couple n'est plus disponible.",
  contractType: "contrat de mariage",
  nextConfirmedEvent: "Prochain mariage",
  noUpcomingConfirmed: "Aucun mariage confirmé à venir",
  coordinateHint: "Email et téléphone pour contacter le couple.",
  searchPlaceholder: "Rechercher un couple, une note…",
  eventNamePlaceholder: "Ex : Mariage Laura & Mehdi",
  billingDateLabel: "Échéance (jours vs date du mariage)",
  billingDateHint: "Ex. -30 = 30 jours avant le mariage",
  missingClientEmail: "Renseignez l'email du couple sur le dossier.",
  missingClientEmailContract:
    "Renseignez l'email du couple avant d'envoyer le contrat.",
  soldeEmailWindow: (days) =>
    `L'email solde s'envoie à J-${days} du mariage (dans ${days} jours ou moins).`,
};

const GENERIC_COPY: EventCopy = {
  clientsSection: "Les contacts",
  person1: "Contact 1",
  person2: "Contact 2",
  clientReference: "le client",
  clientsReference: "les clients",
  bothSigners: "les signataires",
  signerSingular: "signataire",
  eventDate: "Date de l'événement",
  eventDateLower: "événement",
  eventDateBefore: "de l'événement",
  eventDay: "jour de l'événement",
  portalTitle: "Espace client",
  portalPageTitle: "Page client",
  portalShareHint:
    "Partagez-le au client par email ou message.",
  portalArchivedMessage:
    "Ce dossier a été archivé par le domaine. L'espace client n'est plus accessible.",
  portalClosedMessage:
    "Cet événement est clôturé. L'espace client n'est plus disponible.",
  contractType: "contrat de réservation",
  nextConfirmedEvent: "Prochain événement",
  noUpcomingConfirmed: "Aucun événement confirmé à venir",
  coordinateHint: "Email et téléphone pour contacter le client.",
  searchPlaceholder: "Rechercher un client, une note…",
  eventNamePlaceholder: "Ex : Séminaire Acme · 12 juin",
  billingDateLabel: "Échéance (jours vs date de l'événement)",
  billingDateHint: "Ex. -30 = 30 jours avant l'événement",
  missingClientEmail: "Renseignez l'email du client sur le dossier.",
  missingClientEmailContract:
    "Renseignez l'email du client avant d'envoyer le contrat.",
  soldeEmailWindow: (days) =>
    `L'email solde s'envoie à J-${days} de l'événement (dans ${days} jours ou moins).`,
};

/** Terminologie adaptée au type d'événement (mariage vs reste). */
export function getEventCopy(typeSlug: string): EventCopy {
  return isMariageType(typeSlug) ? WEDDING_COPY : GENERIC_COPY;
}

/** Formulations neutres quand le type n'est pas connu (dashboard, paramètres globaux). */
export const NEUTRAL_COPY = {
  pipelineIntro: "Gérez vos demandes et faites avancer vos dossiers",
  addFirstDossier: "Aucun dossier actif — commencez par ajouter une demande.",
  archiveHint:
    "Pour une demande abandonnée ou un dossier perdu. Le créneau redevient disponible.",
  blockDateError: "Seules les demandes en cours peuvent bloquer une date",
  missingEventDate: "Renseignez une date d'événement avant de bloquer",
  demandesSansDate: (count: number) =>
    `${count} demande${count > 1 ? "s" : ""} sans date`,
  demandesEnCours: (count: number) =>
    `${count} demande${count > 1 ? "s" : ""} en cours`,
  calendarLegend: "Demandes (superposables)",
  calendarOverflow: (count: number) =>
    `+${count} demande${count > 1 ? "s" : ""}`,
  paymentEmailIntro:
    "Votre événement chez {domaine} approche. Merci de régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.",
  relanceEcheanceIntro: (domaine: string) =>
    `Votre échéance {libelle} ({montant}) pour votre événement chez ${domaine} arrive le {date_echeance}.`,
  portalPage: "Page client",
  espaceClient: "Espace client",
  portalArchivedMessage:
    "Ce dossier a été archivé par le domaine. L'espace client n'est plus accessible.",
  settingsPortalPage:
    "Mode de paiement par défaut et coordonnées bancaires affichées sur la page client.",
  settingsPortalDeclare:
    "Le client déclare son paiement sur la page client ; vous confirmez ou rejetez depuis le dossier.",
  settingsContractIntro:
    "Depuis un dossier en date bloquée, utilisez « Envoyer le contrat » — les signataires signent en ligne.",
  settingsContractDescription:
    "Signature électronique du contrat de réservation via Signable.",
  settingsEventTypesHint:
    "Utilisés à la création d'une demande. Supprimer un type ne modifie pas les dossiers existants.",
  searchDossier: "Rechercher un dossier, une note…",
  paymentDeclaredBy: "Déclaré par le client le",
  paymentNotificationHint:
    "Quand un client déclare un virement, il apparaîtra ici.",
  missingClientEmail: "Renseignez l'email du client sur le dossier.",
  missingClientEmailContract:
    "Renseignez l'email du client avant d'envoyer le contrat.",
  billingSoldeLabel: "Échéance (jours vs date de l'événement)",
  billingSoldeHint: "Ex. -30 = 30 jours avant l'événement",
  billingSoldeDay: "Le jour de l'événement",
  billingSoldeBefore: (days: number) =>
    `${days} jours avant l'événement`,
  billingSoldeAfter: (days: number) => `J+${days} après l'événement`,
  billingDateRequired: "Date d'événement requise",
} as const;
