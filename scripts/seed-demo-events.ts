/**
 * Insère 9 événements de démo (3 par colonne Kanban) pour le premier workspace.
 * Usage: npm run db:seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type EventStatus = "prospect" | "option" | "confirme";

const DEMO_EVENTS: Array<{
  nom: string;
  statut: EventStatus;
  date: string;
  nuits: number;
  prix: number;
  capacite: number;
  notes: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  payments?: Array<{
    label: string;
    pct: number;
    statut: "paye" | "en_attente";
    monthsBefore: number;
  }>;
}> = [
  // ——— Prospects (3) ———
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
  // ——— Option / Contrat (3) ———
  {
    nom: "Alice & Pierre",
    statut: "option",
    date: "2026-07-18",
    nuits: 2,
    prix: 24000,
    capacite: 85,
    notes: "Contrat signé le 12/05. En attente acompte.",
    adresse: "3 place de la République\n75011 Paris",
    email: "alice.martin@gmail.com",
    telephone: "06 45 12 88 90",
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "en_attente", monthsBefore: 2 },
      { label: "Solde", pct: 0.7, statut: "en_attente", monthsBefore: 1 },
    ],
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
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "paye", monthsBefore: 4 },
      { label: "Solde", pct: 0.7, statut: "en_attente", monthsBefore: 2 },
    ],
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
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "en_attente", monthsBefore: 5 },
      { label: "Solde", pct: 0.7, statut: "en_attente", monthsBefore: 2 },
    ],
  },
  // ——— Confirmés (3) ———
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
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "paye", monthsBefore: 8 },
      { label: "Solde", pct: 0.7, statut: "paye", monthsBefore: 1 },
    ],
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
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "paye", monthsBefore: 6 },
      { label: "Solde", pct: 0.7, statut: "en_attente", monthsBefore: 2 },
    ],
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
    payments: [
      { label: "Acompte 30%", pct: 0.3, statut: "paye", monthsBefore: 5 },
      { label: "Solde", pct: 0.7, statut: "paye", monthsBefore: 1 },
    ],
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

async function main() {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: workspaces, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, nom_domaine")
    .limit(1);

  if (wsErr || !workspaces?.length) {
    console.error("✗ Aucun workspace trouvé. Créez un compte gérant d'abord.");
    process.exit(1);
  }

  const workspaceId = workspaces[0].id;
  console.log(`→ Workspace : ${workspaces[0].nom_domaine}`);

  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("workspace_id", workspaceId);

  if (existing?.length) {
    console.log(`→ Suppression de ${existing.length} événement(s) existant(s)…`);
    await supabase.from("payments").delete().eq("workspace_id", workspaceId);
    await supabase.from("events").delete().eq("workspace_id", workspaceId);
  }

  await supabase
    .from("workspaces")
    .update({
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
    })
    .eq("id", workspaceId);

  let created = 0;

  for (const demo of DEMO_EVENTS) {
    const dateFin = addDays(demo.date, demo.nuits - 1);

    const [p1, p2] = demo.nom.split(" & ");

    const { data: event, error: evErr } = await supabase
      .from("events")
      .insert({
        workspace_id: workspaceId,
        type_evenement: "mariage",
        nom_evenement: `Mariage ${demo.nom}`,
        nom_des_maries: demo.nom,
        marie1_prenom: p1?.split(" ")[0] ?? p1 ?? "",
        marie1_nom: p1?.split(" ").slice(1).join(" ") ?? "",
        marie2_prenom: p2?.split(" ")[0] ?? p2 ?? "",
        marie2_nom: p2?.split(" ").slice(1).join(" ") ?? "",
        adresse_postale: demo.adresse ?? "",
        email: demo.email ?? "",
        telephone: demo.telephone ?? "",
        date_debut: demo.date,
        date_fin: dateFin,
        statut: demo.statut,
        capacite_hebergement_totale: demo.capacite,
        prix_total: demo.prix,
        notes_internes: demo.notes,
        message_accueil:
          demo.statut === "confirme"
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

  console.log(`\n✓ ${created} événements de démo créés`);
  console.log("  · 3 prospects · 3 options · 3 confirmés");
  console.log("  · Échéanciers sur options et confirmés");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
