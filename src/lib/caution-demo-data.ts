export type CautionDemoStatus =
  | "en_attente"
  | "empreinte"
  | "liberee"
  | "expiree";

export type CautionDemoRequest = {
  id: string;
  clientName: string;
  clientEmail: string;
  eventLabel: string;
  eventDate: string;
  amount: number;
  status: CautionDemoStatus;
  createdAt: string;
  linkSentAt?: string;
};

export const CAUTION_STATUS_LABELS: Record<CautionDemoStatus, string> = {
  en_attente: "En attente client",
  empreinte: "Empreinte validée",
  liberee: "Libérée",
  expiree: "Expirée",
};

export const DEMO_CAUTION_REQUESTS: CautionDemoRequest[] = [
  {
    id: "c1",
    clientName: "Sophie & Thomas Martin",
    clientEmail: "sophie.thomas.mariage@gmail.com",
    eventLabel: "Mariage — 120 invités",
    eventDate: "2026-08-14",
    amount: 2500,
    status: "empreinte",
    createdAt: "2026-06-02",
    linkSentAt: "2026-06-02",
  },
  {
    id: "c2",
    clientName: "Groupe Nexa Conseil",
    clientEmail: "events@nexa-conseil.fr",
    eventLabel: "Séminaire — 2 nuits",
    eventDate: "2026-09-20",
    amount: 1800,
    status: "en_attente",
    createdAt: "2026-06-10",
    linkSentAt: "2026-06-10",
  },
  {
    id: "c3",
    clientName: "Camille & Julien Dupont",
    clientEmail: "camille.julien@yahoo.fr",
    eventLabel: "Mariage — domaine complet",
    eventDate: "2026-07-11",
    amount: 2500,
    status: "liberee",
    createdAt: "2026-04-18",
    linkSentAt: "2026-04-18",
  },
  {
    id: "c4",
    clientName: "Anniversaire — Famille Rousseau",
    clientEmail: "famille.rousseau@gmail.com",
    eventLabel: "Soirée privée",
    eventDate: "2026-05-24",
    amount: 1200,
    status: "liberee",
    createdAt: "2026-03-05",
    linkSentAt: "2026-03-06",
  },
  {
    id: "c5",
    clientName: "Laura & Sébastien",
    clientEmail: "laura.sebastien@outlook.fr",
    eventLabel: "Mariage",
    eventDate: "2026-06-28",
    amount: 2500,
    status: "expiree",
    createdAt: "2026-05-01",
    linkSentAt: "2026-05-01",
  },
];
