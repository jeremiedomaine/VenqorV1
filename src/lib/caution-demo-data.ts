export type SwiklyStatus =
  | "a_envoyer"
  | "envoye"
  | "empreinte"
  | "liberee"
  | "expiree";

export type EdlStatus = "manquant" | "enregistree" | "envoyee";

export type ExtraRequestStatus = "nouvelle" | "vue" | "facturee";

export type CautionSejour = {
  id: string;
  couple: string;
  email: string;
  telephone: string;
  dateArrivee: string;
  dateDepart: string;
  invitees: number;
  couchages: number;
  cautionAmount: number;
  swiklyStatus: SwiklyStatus;
  swiklySentAt?: string;
  j7Date: string;
  edlEntree: EdlStatus;
  edlSortie: EdlStatus;
  edlEntreeFile?: string;
  edlSortieFile?: string;
  /** URL blob locale (démo) pour téléchargement côté domaine */
  edlEntreeUrl?: string;
  edlSortieUrl?: string;
  /** Fichier réel pour envoi / lien téléchargement mariés */
  edlEntreeBlob?: File;
  edlSortieBlob?: File;
  extras: Array<{
    id: string;
    label: string;
    requestedAt: string;
    status: ExtraRequestStatus;
  }>;
};

export const SWIKLY_STATUS_LABELS: Record<SwiklyStatus, string> = {
  a_envoyer: "À envoyer",
  envoye: "Lien envoyé",
  empreinte: "Empreinte OK",
  liberee: "Libérée",
  expiree: "Expirée",
};

export const EDL_STATUS_LABELS: Record<EdlStatus, string> = {
  manquant: "À faire",
  enregistree: "Vidéo enregistrée",
  envoyee: "Envoyée aux mariés",
};

/** Démo calée sur une saison type Ferme de la Loge */
export const DEMO_SEJOURS: CautionSejour[] = [
  {
    id: "s1",
    couple: "Léa & Maxime",
    email: "lea.maxime@gmail.com",
    telephone: "06 33 44 55 66",
    dateArrivee: "2026-07-24",
    dateDepart: "2026-07-26",
    invitees: 110,
    couchages: 40,
    cautionAmount: 500,
    swiklyStatus: "a_envoyer",
    j7Date: "2026-07-17",
    edlEntree: "manquant",
    edlSortie: "manquant",
    extras: [
      {
        id: "e1",
        label: "Ajout boutonnières × 4",
        requestedAt: "2026-07-18",
        status: "nouvelle",
      },
    ],
  },
  {
    id: "s2",
    couple: "Sophie & Thomas",
    email: "sophie.thomas.mariage@gmail.com",
    telephone: "06 98 11 22 33",
    dateArrivee: "2026-08-07",
    dateDepart: "2026-08-09",
    invitees: 95,
    couchages: 38,
    cautionAmount: 800,
    swiklyStatus: "envoye",
    swiklySentAt: "2026-07-31",
    j7Date: "2026-07-31",
    edlEntree: "manquant",
    edlSortie: "manquant",
    extras: [],
  },
  {
    id: "s3",
    couple: "Camille & Julien",
    email: "camille.julien@yahoo.fr",
    telephone: "07 65 43 21 09",
    dateArrivee: "2026-07-10",
    dateDepart: "2026-07-12",
    invitees: 120,
    couchages: 44,
    cautionAmount: 500,
    swiklyStatus: "empreinte",
    swiklySentAt: "2026-07-03",
    j7Date: "2026-07-03",
    edlEntree: "envoyee",
    edlSortie: "manquant",
    edlEntreeFile: "edl-entree-camille-julien.mp4",
    extras: [
      {
        id: "e2",
        label: "Champagne supplémentaire (12 bouteilles)",
        requestedAt: "2026-07-08",
        status: "vue",
      },
    ],
  },
  {
    id: "s4",
    couple: "Manon & Hugo",
    email: "manon.hugo@gmail.com",
    telephone: "06 77 88 99 00",
    dateArrivee: "2026-06-20",
    dateDepart: "2026-06-22",
    invitees: 80,
    couchages: 32,
    cautionAmount: 500,
    swiklyStatus: "liberee",
    swiklySentAt: "2026-06-13",
    j7Date: "2026-06-13",
    edlEntree: "envoyee",
    edlSortie: "envoyee",
    edlEntreeFile: "edl-entree-manon-hugo.mp4",
    edlSortieFile: "edl-sortie-manon-hugo.mp4",
    extras: [],
  },
];
