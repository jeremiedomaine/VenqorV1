import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { billingFromWorkspace } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import type { Event, Workspace } from "@/lib/types";

export type ContratVariableDef = {
  key: string;
  label: string;
  example: string;
};

/** Variables disponibles dans les modèles Word — syntaxe docxtemplater : {cle} */
export const CONTRAT_VARIABLES: ContratVariableDef[] = [
  { key: "nom_domaine", label: "Nom du domaine", example: "Château des Lauriers" },
  { key: "marie1_prenom", label: "Prénom marié(e) 1", example: "Marie" },
  { key: "marie1_nom", label: "Nom marié(e) 1", example: "Dupont" },
  { key: "marie1_nom_complet", label: "Nom complet marié(e) 1", example: "Marie Dupont" },
  { key: "marie2_prenom", label: "Prénom marié(e) 2", example: "Jean" },
  { key: "marie2_nom", label: "Nom marié(e) 2", example: "Martin" },
  { key: "marie2_nom_complet", label: "Nom complet marié(e) 2", example: "Jean Martin" },
  { key: "noms_maries", label: "Noms des mariés", example: "Marie Dupont & Jean Martin" },
  { key: "nom_evenement", label: "Nom de l'événement", example: "Mariage Marie & Jean" },
  { key: "date_mariage", label: "Date du mariage", example: "14 juin 2026" },
  { key: "date_mariage_fin", label: "Date de fin", example: "15 juin 2026" },
  { key: "prix_total", label: "Montant total", example: "24 000 €" },
  { key: "acompte_label", label: "Libellé acompte", example: "Acompte 30 %" },
  { key: "acompte_montant", label: "Montant acompte", example: "7 200 €" },
  { key: "solde_label", label: "Libellé solde", example: "Solde" },
  { key: "solde_montant", label: "Montant solde", example: "16 800 €" },
  { key: "email", label: "Email du couple", example: "couple@email.fr" },
  { key: "telephone", label: "Téléphone", example: "06 12 34 56 78" },
  { key: "adresse", label: "Adresse postale", example: "12 rue des Lilas, 33000 Bordeaux" },
  { key: "contact_nom", label: "Contact domaine", example: "Sophie Martin" },
  { key: "contact_email", label: "Email domaine", example: "contact@domaine.fr" },
  { key: "contact_telephone", label: "Téléphone domaine", example: "05 56 00 00 00" },
];

export type ContratMergeInput = {
  event: Pick<
    Event,
    | "nom_evenement"
    | "nom_des_maries"
    | "marie1_prenom"
    | "marie1_nom"
    | "marie2_prenom"
    | "marie2_nom"
    | "email"
    | "telephone"
    | "adresse_postale"
    | "date_debut"
    | "date_fin"
    | "prix_total"
  >;
  workspace: Pick<
    Workspace,
    | "nom_domaine"
    | "contact_nom"
    | "contact_email"
    | "contact_telephone"
    | "facturation_acompte_label"
    | "facturation_acompte_pct"
    | "facturation_solde_label"
    | "facturation_solde_pct"
  >;
  payments?: Array<{ label: string; montant: number }>;
};

function formatEventDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "d MMMM yyyy", { locale: fr });
}

function trim(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

export function buildContratMergeData(input: ContratMergeInput): Record<string, string> {
  const m1p = trim(input.event.marie1_prenom);
  const m1n = trim(input.event.marie1_nom);
  const m2p = trim(input.event.marie2_prenom);
  const m2n = trim(input.event.marie2_nom);
  const nomsMaries =
    trim(input.event.nom_des_maries) ||
    [fullName(m1p, m1n), fullName(m2p, m2n)].filter(Boolean).join(" & ");

  const prixTotal = Number(input.event.prix_total) || 0;
  const billing = billingFromWorkspace(input.workspace as Workspace);

  let acompteMontant = Math.round(prixTotal * (billing.facturation_acompte_pct / 100));
  let soldeMontant = prixTotal - acompteMontant;
  let acompteLabel = billing.facturation_acompte_label;
  let soldeLabel = billing.facturation_solde_label;

  if (input.payments?.length) {
    const acompte = input.payments.find((p) =>
      /acompte/i.test(p.label),
    );
    const solde = input.payments.find((p) =>
      /solde/i.test(p.label),
    );
    if (acompte) {
      acompteMontant = Math.round(Number(acompte.montant));
      acompteLabel = acompte.label;
    }
    if (solde) {
      soldeMontant = Math.round(Number(solde.montant));
      soldeLabel = solde.label;
    }
  }

  return {
    nom_domaine: trim(input.workspace.nom_domaine),
    marie1_prenom: m1p,
    marie1_nom: m1n,
    marie1_nom_complet: fullName(m1p, m1n),
    marie2_prenom: m2p,
    marie2_nom: m2n,
    marie2_nom_complet: fullName(m2p, m2n),
    noms_maries: nomsMaries,
    nom_evenement: trim(input.event.nom_evenement) || nomsMaries,
    date_mariage: formatEventDate(input.event.date_debut),
    date_mariage_fin: formatEventDate(input.event.date_fin),
    prix_total: prixTotal > 0 ? formatCurrency(prixTotal) : "",
    acompte_label: acompteLabel,
    acompte_montant: acompteMontant > 0 ? formatCurrency(acompteMontant) : "",
    solde_label: soldeLabel,
    solde_montant: soldeMontant > 0 ? formatCurrency(soldeMontant) : "",
    email: trim(input.event.email),
    telephone: trim(input.event.telephone),
    adresse: trim(input.event.adresse_postale),
    contact_nom: trim(input.workspace.contact_nom),
    contact_email: trim(input.workspace.contact_email),
    contact_telephone: trim(input.workspace.contact_telephone),
  };
}

/** Données fictives pour générer le PDF d'aperçu (placement signatures). */
export function buildSampleContratMergeData(
  workspace: Pick<
    Workspace,
    | "nom_domaine"
    | "contact_nom"
    | "contact_email"
    | "contact_telephone"
    | "facturation_acompte_label"
    | "facturation_acompte_pct"
    | "facturation_solde_label"
    | "facturation_solde_pct"
  >,
): Record<string, string> {
  return buildContratMergeData({
    workspace,
    event: {
      nom_evenement: "Mariage Marie & Jean",
      nom_des_maries: "Marie Dupont & Jean Martin",
      marie1_prenom: "Marie",
      marie1_nom: "Dupont",
      marie2_prenom: "Jean",
      marie2_nom: "Martin",
      email: "couple@exemple.fr",
      telephone: "06 12 34 56 78",
      adresse_postale: "12 rue des Lilas\n33000 Bordeaux",
      date_debut: "2026-06-14",
      date_fin: "2026-06-15",
      prix_total: 24000,
    },
  });
}
