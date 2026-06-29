import type { SupabaseClient } from "@supabase/supabase-js";

export type DemoEventStatus = "prospect" | "option" | "confirme";

export type DemoPaymentStatut = "paye" | "en_attente" | "declare_paye";

const ACOMPTE_LABEL = "Acompte 50%";
const ACOMPTE_PCT = 0.5;
const SOLDE_PCT = 0.5;

function demoPayments(
  acompte: DemoPaymentStatut,
  solde: DemoPaymentStatut,
  acompteMonths: number,
  soldeMonths: number,
): DemoEvent["payments"] {
  return [
    {
      label: ACOMPTE_LABEL,
      pct: ACOMPTE_PCT,
      statut: acompte,
      monthsBefore: acompteMonths,
    },
    {
      label: "Solde",
      pct: SOLDE_PCT,
      statut: solde,
      monthsBefore: soldeMonths,
    },
  ];
}

export type DemoEvent = {
  nom: string;
  statut: DemoEventStatus;
  type_evenement?: string;
  date: string;
  nuits: number;
  prix: number;
  capacite: number;
  notes: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  contrat_statut?: "non_envoye" | "en_cours" | "signe";
  cloture?: boolean;
  payments?: Array<{
    label: string;
    pct: number;
    statut: "paye" | "en_attente" | "declare_paye";
    monthsBefore: number;
  }>;
};

export const DEMO_WORKSPACE = {
  nom_domaine: "Château des Lauriers",
  guide_infos_pratiques:
    "Arrivée des invités à 15h. Parking gratuit sur place.\nCérémonie à 16h30 dans le parc.\nHébergement sur place : 45 personnes maximum.",
  guide_regles:
    "Fin de soirée à 2h — musique amplifiée jusqu'à minuit uniquement.\nLe domaine est non-fumeur en intérieur.\nAnimaux non admis.",
  guide_prestataires:
    "Photographe : Studio Lumière — 06 12 34 56 78\nTraiteur : Les Saveurs du Terroir — contact@saveurs.fr\nFleuriste : Pétales & Cie — 05 56 78 90 12",
  contact_nom: "Marie Dupont",
  contact_email: "contact@chateaudeslauriers.fr",
  contact_telephone: "06 98 76 54 32",
  facturation_acompte_label: ACOMPTE_LABEL,
  facturation_acompte_pct: 50,
  facturation_acompte_jours: 60,
  facturation_solde_label: "Solde",
  facturation_solde_pct: 50,
  facturation_solde_jours: 30,
  facturation_configuree: true,
  onboarding_completed_at: new Date().toISOString(),
  mode_paiement_defaut: "virement" as const,
  iban: "FR76 3000 4000 5000 6000 7000 890",
  bic: "BNPAFRPPXXX",
  titulaire_compte: "SAS Château des Lauriers",
  instructions_virement:
    "Merci d'indiquer le nom des mariés en référence de virement.",
  objectif_dossiers_annuel: 22,
  objectif_ca_annuel: 580000,
  relances_actives: true,
};

export const DEMO_EVENTS: DemoEvent[] = [
  {
    nom: "Élodie & Christophe",
    statut: "prospect",
    date: "2027-06-19",
    nuits: 2,
    prix: 19500,
    capacite: 70,
    notes: "Demande web — répondre sous 48h.",
    adresse: "12 rue des Lilas\n33000 Bordeaux",
  },
  {
    nom: "Laura & Sébastien",
    statut: "prospect",
    date: "2026-09-26",
    nuits: 2,
    prix: 22000,
    capacite: 75,
    notes: "Visite prévue le 22/06 à 14h.",
    adresse: "8 avenue Victor Hugo\n87000 Limoges",
  },
  {
    nom: "Margot & Adrien",
    statut: "prospect",
    date: "2026-10-10",
    nuits: 2,
    prix: 26000,
    capacite: 95,
    notes: "Intéressés par le package 2 nuits. Budget flexible.",
    adresse: "45 chemin du Moulin\n24100 Bergerac",
  },
  {
    nom: "Groupe Nexa — Séminaire",
    statut: "prospect",
    type_evenement: "autre",
    date: "2026-11-14",
    nuits: 1,
    prix: 8500,
    capacite: 40,
    notes: "Demande entreprise — 2 salles de travail + dîner de gala.",
    adresse: "Nexa Conseil\n75008 Paris",
    email: "events@nexa-conseil.fr",
    telephone: "01 42 00 00 00",
  },
  {
    nom: "Alice & Pierre",
    statut: "confirme",
    date: "2026-07-18",
    nuits: 2,
    prix: 24000,
    capacite: 85,
    notes: "Contrat signé le 12/05. Acompte en attente de validation.",
    adresse: "3 place de la République\n75011 Paris",
    email: "alice.martin@gmail.com",
    telephone: "06 45 12 88 90",
    contrat_statut: "signe",
    payments: demoPayments("en_attente", "en_attente", 2, 1),
  },
  {
    nom: "Sarah & David",
    statut: "option",
    date: "2026-08-22",
    nuits: 2,
    prix: 31000,
    capacite: 115,
    notes: "Couple de Paris. Visite effectuée. Date bloquée jusqu'au 30/06.",
    adresse: "18 rue de Rivoli\n75004 Paris",
    email: "sarah.david@outlook.fr",
    telephone: "07 81 22 45 67",
    contrat_statut: "en_cours",
    payments: demoPayments("paye", "en_attente", 4, 2),
  },
  {
    nom: "Nina & Gabriel",
    statut: "option",
    date: "2026-06-27",
    nuits: 2,
    prix: 25200,
    capacite: 88,
    notes: "Visite faite — contrat en préparation.",
    adresse: "6 rue des Ormes\n86000 Poitiers",
    email: "nina.gabriel@gmail.com",
    telephone: "06 54 32 10 98",
    contrat_statut: "en_cours",
    payments: demoPayments("en_attente", "en_attente", 3, 1),
  },
  {
    nom: "Chloé & Benoît",
    statut: "option",
    date: "2026-11-07",
    nuits: 2,
    prix: 26800,
    capacite: 92,
    notes: "Option posée après visite du 15/05.",
    adresse: "29 avenue Jean Jaurès\n69007 Lyon",
    email: "chloe.benoit@icloud.com",
    telephone: "07 12 34 56 78",
    payments: demoPayments("paye", "en_attente", 2, 1),
  },
  {
    nom: "Clara & Mathieu",
    statut: "option",
    date: "2026-09-19",
    nuits: 3,
    prix: 38500,
    capacite: 140,
    notes: "Week-end complet. Hébergement 45 personnes sur place.",
    adresse: "La Grangette\n46230 Lalbenque",
    email: "clara.mathieu@free.fr",
    telephone: "06 12 98 76 54",
    contrat_statut: "non_envoye",
    payments: demoPayments("en_attente", "en_attente", 5, 2),
  },
  {
    nom: "Léa & Maxime",
    statut: "option",
    date: "2026-10-03",
    nuits: 2,
    prix: 27500,
    capacite: 90,
    notes: "Devis envoyé. Relance visite prévue la semaine prochaine.",
    adresse: "14 rue Gambetta\n31000 Toulouse",
    email: "lea.maxime@gmail.com",
    telephone: "06 33 44 55 66",
    payments: demoPayments("declare_paye", "en_attente", 3, 1),
  },
  {
    nom: "Anaïs & Lucas",
    statut: "prospect",
    date: "2026-05-16",
    nuits: 2,
    prix: 21000,
    capacite: 80,
    notes: "Premier contact téléphonique — envoyer brochure.",
    adresse: "11 rue du Stade\n40000 Mont-de-Marsan",
  },
  {
    nom: "Pauline & Romain",
    statut: "prospect",
    date: "2026-11-21",
    nuits: 2,
    prix: 24500,
    capacite: 85,
    notes: "Recommandés par Sophie & Thomas (2026).",
    adresse: "2 impasse des Vignes\n33700 Mérignac",
  },
  {
    nom: "Anniversaire 50 ans — Famille Martin",
    statut: "prospect",
    type_evenement: "autre",
    date: "2026-12-12",
    nuits: 1,
    prix: 12000,
    capacite: 55,
    notes: "Soirée familiale + brunch du lendemain.",
    adresse: "Famille Martin\n33160 Saint-Médard-en-Jalles",
    email: "martin.famille@gmail.com",
    telephone: "06 70 80 90 00",
  },
  {
    nom: "Sophie & Thomas",
    statut: "confirme",
    date: "2026-06-20",
    nuits: 2,
    prix: 32000,
    capacite: 120,
    notes: "Cérémonie laïque dans le parc. Traiteur confirmé.",
    adresse: "5 allée des Vignes\n33170 Gradignan",
    email: "sophie.thomas.mariage@gmail.com",
    telephone: "06 98 11 22 33",
    contrat_statut: "signe",
    payments: demoPayments("paye", "paye", 8, 1),
  },
  {
    nom: "Camille & Julien",
    statut: "confirme",
    date: "2026-07-11",
    nuits: 2,
    prix: 28500,
    capacite: 95,
    notes: "120 invités. Besoin de 15 chambres.",
    adresse: "22 rue Pasteur\n64000 Pau",
    email: "camille.julien@yahoo.fr",
    telephone: "07 65 43 21 09",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 6, 2),
  },
  {
    nom: "Émilie & Nicolas",
    statut: "confirme",
    date: "2026-09-05",
    nuits: 2,
    prix: 30200,
    capacite: 105,
    notes: "DJ externe autorisé. Dîner sous la tente.",
    adresse: "17 chemin des Acacias\n47000 Agen",
    email: "emilie.nicolas@gmail.com",
    telephone: "06 88 77 66 55",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 5, 2),
  },
  {
    nom: "Océane & Lucas",
    statut: "confirme",
    date: "2026-10-24",
    nuits: 2,
    prix: 27800,
    capacite: 90,
    notes: "Cérémonie religieuse le matin, réception l'après-midi.",
    adresse: "4 rue de la Gare\n24000 Périgueux",
    email: "oceane.lucas@free.fr",
    telephone: "07 44 33 22 11",
    contrat_statut: "signe",
    payments: demoPayments("paye", "paye", 4, 1),
  },
  {
    nom: "Manon & Hugo",
    statut: "confirme",
    date: "2026-08-29",
    nuits: 2,
    prix: 26500,
    capacite: 80,
    notes: "Cérémonie civile la veille à la mairie voisine.",
    adresse: "Le Bourg\n24250 Domme",
    email: "manon.hugo@gmail.com",
    telephone: "06 77 88 99 00",
    contrat_statut: "signe",
    payments: demoPayments("paye", "paye", 5, 1),
  },
  // ——— 2026 : saison en cours (objectifs pilotage ~85 %) ———
  {
    nom: "Valentine & Jérôme",
    statut: "confirme",
    date: "2026-03-21",
    nuits: 2,
    prix: 27200,
    capacite: 88,
    notes: "Mariage de printemps — dossier clôturé.",
    adresse: "14 rue des Vignes\n33500 Libourne",
    email: "valentine.jerome@gmail.com",
    telephone: "06 22 33 44 55",
    contrat_statut: "signe",
    cloture: true,
    payments: demoPayments("paye", "paye", 6, 1),
  },
  {
    nom: "Mélanie & Florian",
    statut: "confirme",
    date: "2026-04-18",
    nuits: 2,
    prix: 29500,
    capacite: 102,
    notes: "Réception en orangeraie — dossier clôturé.",
    adresse: "8 chemin du Lac\n87100 Limoges",
    email: "melanie.florian@yahoo.fr",
    telephone: "07 55 66 77 88",
    contrat_statut: "signe",
    cloture: true,
    payments: demoPayments("paye", "paye", 5, 1),
  },
  {
    nom: "Céline & Romain",
    statut: "confirme",
    date: "2026-05-09",
    nuits: 2,
    prix: 28800,
    capacite: 96,
    notes: "Week-end de Pâques prolongé — dossier clôturé.",
    adresse: "Le Bourg\n24250 Domme",
    email: "celine.romain@free.fr",
    telephone: "06 44 55 66 77",
    contrat_statut: "signe",
    cloture: true,
    payments: demoPayments("paye", "paye", 5, 1),
  },
  {
    nom: "Gala annuel — Rotary Club",
    statut: "confirme",
    type_evenement: "autre",
    date: "2026-06-28",
    nuits: 1,
    prix: 14200,
    capacite: 80,
    notes: "Dîner de gala + nuitée VIP pour le bureau.",
    adresse: "Rotary Club Périgueux\n24000 Périgueux",
    email: "gala@rotary-perigueux.fr",
    telephone: "05 53 00 00 00",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 3, 1),
  },
  {
    nom: "Aurore & Kevin",
    statut: "confirme",
    date: "2026-07-04",
    nuits: 2,
    prix: 31200,
    capacite: 110,
    notes: "Feu d'artifice prévu en fin de soirée.",
    adresse: "25 rue de la République\n86000 Poitiers",
    email: "aurore.kevin@gmail.com",
    telephone: "06 99 88 77 66",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 4, 2),
  },
  {
    nom: "Patricia & Yann",
    statut: "confirme",
    date: "2026-07-25",
    nuits: 2,
    prix: 27600,
    capacite: 92,
    notes: "Mariage bilingue FR/EN — 40 invités étrangers.",
    adresse: "3 quai des Chartrons\n33000 Bordeaux",
    email: "patricia.yann@outlook.com",
    telephone: "07 22 33 44 55",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 4, 2),
  },
  {
    nom: "Sandy & Florian",
    statut: "confirme",
    date: "2026-08-08",
    nuits: 2,
    prix: 30100,
    capacite: 108,
    notes: "Traiteur externe validé. Plan de table en cours.",
    adresse: "11 avenue des Pins\n40000 Mont-de-Marsan",
    email: "sandy.florian@gmail.com",
    telephone: "06 77 66 55 44",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 5, 2),
  },
  {
    nom: "Morgane & Axel",
    statut: "confirme",
    date: "2026-08-15",
    nuits: 2,
    prix: 25400,
    capacite: 78,
    notes: "Cérémonie laïque dans la roseraie.",
    adresse: "7 impasse des Lilas\n24100 Bergerac",
    email: "morgane.axel@free.fr",
    telephone: "06 12 98 76 54",
    contrat_statut: "signe",
    payments: demoPayments("paye", "paye", 4, 1),
  },
  {
    nom: "Cécilia & Jérémie",
    statut: "confirme",
    date: "2026-09-12",
    nuits: 2,
    prix: 31800,
    capacite: 115,
    notes: "Grand format — 130 invités au total.",
    adresse: "42 rue Victor Hugo\n87000 Limoges",
    email: "cecilia.jeremie@gmail.com",
    telephone: "07 88 99 00 11",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 5, 2),
  },
  {
    nom: "Marion & Quentin",
    statut: "confirme",
    date: "2026-10-17",
    nuits: 2,
    prix: 28900,
    capacite: 98,
    notes: "Décoration florale blanc & gold.",
    adresse: "19 rue Pasteur\n64000 Pau",
    email: "marion.quentin@icloud.com",
    telephone: "06 33 22 11 00",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 4, 2),
  },
  {
    nom: "Elisa & Romain",
    statut: "confirme",
    date: "2026-11-28",
    nuits: 2,
    prix: 26700,
    capacite: 86,
    notes: "Vin d'honneur au salon d'honneur.",
    adresse: "5 allée du Château\n33170 Gradignan",
    email: "elisa.romain@gmail.com",
    telephone: "06 55 44 33 22",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 3, 2),
  },
  {
    nom: "Karine & David",
    statut: "confirme",
    date: "2026-12-05",
    nuits: 2,
    prix: 29300,
    capacite: 94,
    notes: "Mariage d'hiver — ambiance bougies et cheminée.",
    adresse: "28 rue Nationale\n59800 Lille",
    email: "karine.david@yahoo.fr",
    telephone: "07 11 22 33 44",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 3, 2),
  },
  {
    nom: "Nathalie & Simon",
    statut: "confirme",
    date: "2026-12-19",
    nuits: 2,
    prix: 28600,
    capacite: 90,
    notes: "Réveillon familial le lendemain au brunch.",
    adresse: "16 rue des Jardins\n35000 Rennes",
    email: "nathalie.simon@proton.me",
    telephone: "06 21 43 65 87",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 2, 2),
  },
  {
    nom: "Julie & Antoine",
    statut: "confirme",
    date: "2025-09-06",
    nuits: 2,
    prix: 29800,
    capacite: 100,
    notes: "Événement passé — dossier clôturé.",
    adresse: "7 rue du Port\n33000 Bordeaux",
    email: "julie.antoine@gmail.com",
    telephone: "06 11 22 33 44",
    contrat_statut: "signe",
    cloture: true,
    payments: demoPayments("paye", "paye", 10, 1),
  },
  // ——— 2027 ———
  {
    nom: "Charlotte & Arthur",
    statut: "prospect",
    date: "2027-05-22",
    nuits: 2,
    prix: 23000,
    capacite: 82,
    notes: "Demande Instagram — répondre avec disponibilités 2027.",
    adresse: "9 rue des Peupliers\n44000 Nantes",
  },
  {
    nom: "Inès & Valentin",
    statut: "prospect",
    date: "2027-07-10",
    nuits: 2,
    prix: 25500,
    capacite: 90,
    notes: "Souhaitent une visite en septembre 2026.",
    adresse: "21 boulevard Carnot\n13008 Marseille",
  },
  {
    nom: "Amélie & Tom",
    statut: "prospect",
    date: "2027-08-15",
    nuits: 2,
    prix: 27200,
    capacite: 95,
    notes: "Budget 25–28 k€. Intéressés par le parc pour la cérémonie.",
    adresse: "3 allée du Château\n37000 Tours",
  },
  {
    nom: "Fanny & Romain",
    statut: "prospect",
    date: "2027-09-18",
    nuits: 2,
    prix: 28900,
    capacite: 100,
    notes: "Date flexible ±1 semaine.",
    adresse: "56 rue Nationale\n59800 Lille",
  },
  {
    nom: "Noémie & Julien",
    statut: "prospect",
    date: "2027-06-05",
    nuits: 2,
    prix: 24100,
    capacite: 78,
    notes: "Contact salon du mariage Bordeaux — lead chaud.",
    adresse: "15 quai des Chartrons\n33000 Bordeaux",
    email: "noemie.julien@outlook.com",
  },
  {
    nom: "Lancement produit — BioVert",
    statut: "option",
    type_evenement: "autre",
    date: "2027-03-15",
    nuits: 1,
    prix: 14500,
    capacite: 60,
    notes: "Événement corporate — cocktail + keynote.",
    adresse: "BioVert SAS\n69002 Lyon",
    email: "communication@biovert.fr",
    telephone: "04 78 00 00 00",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 4, 1),
  },
  {
    nom: "Jade & Louis",
    statut: "option",
    date: "2027-06-12",
    nuits: 2,
    prix: 31500,
    capacite: 110,
    notes: "Contrat signé — acompte demandé.",
    adresse: "8 rue des Écoles\n75005 Paris",
    email: "jade.louis@gmail.com",
    telephone: "06 21 43 65 87",
    contrat_statut: "signe",
    payments: demoPayments("en_attente", "en_attente", 6, 2),
  },
  {
    nom: "Emma & Théo",
    statut: "option",
    date: "2027-07-24",
    nuits: 2,
    prix: 29800,
    capacite: 98,
    notes: "Visite validée. En attente retour contrat.",
    adresse: "Le Hameau\n14400 Bayeux",
    email: "emma.theo@yahoo.fr",
    telephone: "07 98 76 54 32",
    contrat_statut: "en_cours",
    payments: demoPayments("en_attente", "en_attente", 5, 2),
  },
  {
    nom: "Justine & Marc",
    statut: "confirme",
    date: "2027-05-01",
    nuits: 2,
    prix: 33500,
    capacite: 125,
    notes: "Grand mariage — 130 invités prévus.",
    adresse: "42 avenue Foch\n87000 Limoges",
    email: "justine.marc@gmail.com",
    telephone: "06 55 44 33 22",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 8, 2),
  },
  {
    nom: "Lucie & Alex",
    statut: "confirme",
    date: "2027-06-28",
    nuits: 2,
    prix: 30800,
    capacite: 105,
    notes: "Acompte reçu. Solde prévu printemps 2027.",
    adresse: "5 rue du Moulin\n46120 Leyme",
    email: "lucie.alex@free.fr",
    telephone: "06 12 23 34 45",
    contrat_statut: "signe",
    payments: demoPayments("paye", "en_attente", 7, 2),
  },
  {
    nom: "Hélène & Baptiste",
    statut: "confirme",
    date: "2027-08-08",
    nuits: 2,
    prix: 29200,
    capacite: 88,
    notes: "Mariage champêtre — décoration fleurs des champs.",
    adresse: "La Bergerie\n24220 Saint-Cyprien",
    email: "helene.baptiste@gmail.com",
    telephone: "07 11 22 33 44",
    contrat_statut: "signe",
    payments: demoPayments("paye", "paye", 6, 1),
  },
  // ——— 2028 ———
  {
    nom: "Rose & Mattéo",
    statut: "prospect",
    date: "2028-06-17",
    nuits: 2,
    prix: 26500,
    capacite: 92,
    notes: "Première prise de contact — très en amont.",
    adresse: "10 rue Victor Hugo\n17000 La Rochelle",
  },
  {
    nom: "Victoire & Enzo",
    statut: "prospect",
    date: "2028-07-08",
    nuits: 2,
    prix: 27800,
    capacite: 96,
    notes: "Souhaitent réserver une visite pour l'automne 2026.",
    adresse: "27 rue de la Paix\n06000 Nice",
  },
  {
    nom: "Capucine & Dylan",
    statut: "prospect",
    date: "2028-08-21",
    nuits: 2,
    prix: 28400,
    capacite: 100,
    notes: "Recherche domaine avec hébergement 40+ personnes.",
    adresse: "3 place Bellecour\n69002 Lyon",
  },
  {
    nom: "Diane & Samuel",
    statut: "option",
    date: "2028-05-20",
    nuits: 2,
    prix: 30500,
    capacite: 102,
    notes: "Option posée très tôt — couple expatriés (Londres).",
    adresse: "Flat 12, Chelsea Embankment\nLondon SW3",
    email: "diane.samuel@proton.me",
    telephone: "+44 7700 900123",
    contrat_statut: "en_cours",
    payments: demoPayments("en_attente", "en_attente", 8, 2),
  },
  {
    nom: "Zoé & Nathan",
    statut: "prospect",
    date: "2028-09-09",
    nuits: 2,
    prix: 29100,
    capacite: 94,
    notes: "Demande via site — disponibilité à confirmer.",
    adresse: "18 rue des Jardins\n35000 Rennes",
  },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function eventTitle(demo: DemoEvent): string {
  if (demo.type_evenement === "autre") {
    return demo.nom;
  }
  return `Mariage ${demo.nom}`;
}

export async function seedDemoWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<number> {
  await supabase.from("workspaces").update(DEMO_WORKSPACE).eq("id", workspaceId);

  let created = 0;

  for (const demo of DEMO_EVENTS) {
    const dateFin = addDays(demo.date, demo.nuits - 1);
    const isMariage = (demo.type_evenement ?? "mariage") === "mariage";
    const [p1, p2] = isMariage ? demo.nom.split(" & ") : ["", ""];

    const { data: event, error: evErr } = await supabase
      .from("events")
      .insert({
        workspace_id: workspaceId,
        type_evenement: demo.type_evenement ?? "mariage",
        nom_evenement: eventTitle(demo),
        nom_des_maries: isMariage ? demo.nom : demo.nom,
        marie1_prenom: isMariage ? (p1?.split(" ")[0] ?? p1 ?? "") : "",
        marie1_nom: isMariage ? (p1?.split(" ").slice(1).join(" ") ?? "") : "",
        marie2_prenom: isMariage ? (p2?.split(" ")[0] ?? p2 ?? "") : "",
        marie2_nom: isMariage ? (p2?.split(" ").slice(1).join(" ") ?? "") : "",
        adresse_postale: demo.adresse ?? "",
        email: demo.email ?? "",
        telephone: demo.telephone ?? "",
        date_debut: demo.date,
        date_fin: dateFin,
        statut: demo.statut,
        capacite_hebergement_totale: demo.capacite,
        prix_total: demo.prix,
        notes_internes: demo.notes,
        contrat_statut: demo.contrat_statut ?? "non_envoye",
        cloture_at: demo.cloture ? new Date().toISOString() : null,
        message_accueil:
          demo.statut === "confirme" && !demo.cloture
            ? `Bienvenue ${demo.nom} ! Nous avons hâte de célébrer ce moment unique avec vous au domaine.`
            : "",
      })
      .select("id")
      .single();

    if (evErr || !event) {
      console.error(`✗ ${demo.nom}:`, evErr?.message);
      continue;
    }

    if (demo.payments) {
      const rows = demo.payments.map((p) => ({
        workspace_id: workspaceId,
        event_id: event.id,
        label: p.label,
        montant: Math.round(demo.prix * p.pct),
        date_echeance: subtractMonths(demo.date, p.monthsBefore),
        statut: p.statut,
      }));
      await supabase.from("payments").insert(rows);
    }

    created++;
  }

  return created;
}

export async function cleanWorkspaceEvents(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<void> {
  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (!count) return;

  console.log(`→ Suppression de ${count} dossier(s) existant(s)…`);
  await supabase.from("payments").delete().eq("workspace_id", workspaceId);
  await supabase.from("events").delete().eq("workspace_id", workspaceId);
}
