export type EventStatus = "prospect" | "option" | "confirme";
/** Slug : `mariage`, `autre`, ou type personnalisé défini dans les paramètres */
export type EventType = string;
export type PaymentStatus = "en_attente" | "declare_paye" | "paye";
export type PaymentMode = "virement" | "stripe";
export type AcompteSignatureTiming = "with_contract" | "after_contract";
export type ContratStatut =
  | "non_envoye"
  | "en_cours"
  | "signe"
  | "refuse"
  | "expire";

export type ContratSignatureZone = {
  page: number | "last";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ContratSignatureZones = {
  signer1: ContratSignatureZone;
  signer2: ContratSignatureZone;
};

export interface CustomEventType {
  slug: string;
  label: string;
}

export interface Workspace {
  id: string;
  nom_domaine: string;
  logo_url: string | null;
  contrat_template_path: string | null;
  contrat_template_filename: string | null;
  contrat_template_updated_at: string | null;
  contrat_signature_zones: ContratSignatureZones | null;
  contrat_signature_zones_updated_at: string | null;
  guide_infos_pratiques: string;
  guide_regles: string;
  guide_prestataires: string;
  contact_nom: string;
  contact_email: string;
  contact_telephone: string;
  types_evenement_custom: CustomEventType[];
  facturation_acompte_label: string;
  facturation_acompte_pct: number;
  facturation_acompte_jours: number;
  facturation_solde_label: string;
  facturation_solde_pct: number;
  facturation_solde_jours: number;
  objectif_dossiers_annuel: number | null;
  objectif_ca_annuel: number | null;
  mode_paiement_defaut: PaymentMode;
  iban: string | null;
  bic: string | null;
  titulaire_compte: string | null;
  instructions_virement: string;
  stripe_active: boolean;
  automation_paiement_active: boolean;
  email_paiement_objet: string;
  email_paiement_intro: string;
  acompte_signature_timing: AcompteSignatureTiming;
  automation_acompte_active: boolean;
  email_acompte_objet: string;
  email_acompte_intro: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  full_name: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  workspace_id: string;
  type_evenement: EventType;
  nom_evenement: string;
  nom_des_maries: string;
  marie1_prenom: string;
  marie1_nom: string;
  marie2_prenom: string;
  marie2_nom: string;
  adresse_postale: string;
  email: string;
  telephone: string;
  date_debut: string | null;
  date_fin: string | null;
  statut: EventStatus;
  capacite_hebergement_totale: number;
  prix_total: number;
  portal_token: string;
  notes_internes: string;
  message_accueil: string;
  archived_at: string | null;
  cloture_at: string | null;
  yousign_signature_request_id: string | null;
  contrat_statut: ContratStatut;
  contrat_envoye_at: string | null;
  contrat_signe_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  workspace_id: string;
  event_id: string;
  label: string;
  montant: number;
  date_echeance: string | null;
  statut: PaymentStatus;
  mode_paiement: PaymentMode;
  reference_virement: string | null;
  declared_at: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  payment_request_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalData {
  workspace: {
    nom_domaine: string;
    logo_url: string | null;
    guide_infos_pratiques: string;
    guide_regles: string;
    guide_prestataires: string;
    contact_nom: string;
    contact_email: string;
    contact_telephone: string;
    mode_paiement_defaut: PaymentMode;
    iban: string | null;
    bic: string | null;
    titulaire_compte: string | null;
    instructions_virement: string;
    stripe_active: boolean;
  };
  event: {
    nom_des_maries: string;
    date_debut: string | null;
    date_fin: string | null;
    statut: EventStatus;
    capacite_hebergement_totale: number;
    prix_total: number;
    message_accueil: string;
  };
  payments: Array<{
    id: string;
    label: string;
    montant: number;
    date_echeance: string | null;
    statut: PaymentStatus;
    mode_paiement: PaymentMode;
    reference_virement: string | null;
  }>;
}

export const CONTRAT_STATUT_LABELS: Record<ContratStatut, string> = {
  non_envoye: "Non envoyé",
  en_cours: "En attente de signature",
  signe: "Signé",
  refuse: "Refusé",
  expire: "Expiré",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  prospect: "Prospects",
  option: "Dates bloquées",
  confirme: "Confirmés",
};

/** Libellé singulier pour messages et tooltips */
export const EVENT_STATUS_SINGULAR: Record<EventStatus, string> = {
  prospect: "Prospect",
  option: "Date bloquée",
  confirme: "Confirmé",
};

export const KANBAN_COLUMN_HINTS: Record<EventStatus, string> = {
  prospect: "Demande, visite, devis en cours",
  option: "Date réservée — acompte en attente",
  confirme: "Acompte reçu, préparation du jour J",
};

export const KANBAN_COLUMNS: EventStatus[] = [
  "prospect",
  "option",
  "confirme",
];

/** Colonnes affichables sur le board (inclut les dossiers clôturés). */
export type KanbanColumnId = EventStatus | "cloture";

export const KANBAN_BOARD_COLUMNS: KanbanColumnId[] = [
  "prospect",
  "option",
  "confirme",
  "cloture",
];

export const KANBAN_COLUMN_LABELS: Record<KanbanColumnId, string> = {
  prospect: "Prospects",
  option: "Dates bloquées",
  confirme: "Confirmés",
  cloture: "Clôturés",
};

export const KANBAN_BOARD_COLUMN_HINTS: Record<KanbanColumnId, string> = {
  prospect: "Demande, visite, devis en cours",
  option: "Date réservée — acompte en attente",
  confirme: "Acompte reçu, préparation du jour J",
  cloture: "Solde réglé — suivi terminé",
};

/** Statuts avec espace mariés + échéancier engagés */
export const SIGNED_EVENT_STATUSES: EventStatus[] = ["option", "confirme"];
