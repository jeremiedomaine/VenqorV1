import type { CustomEventType } from "@/lib/types";
import { buildDefaultEventName } from "@/lib/event-types";

export function buildCoupleDisplayName(parts: {
  marie1_prenom?: string | null;
  marie1_nom?: string | null;
  marie2_prenom?: string | null;
  marie2_nom?: string | null;
  nom_des_maries?: string | null;
  nom_evenement?: string | null;
}): string {
  const person1 = [parts.marie1_prenom, parts.marie1_nom]
    .filter(Boolean)
    .join(" ")
    .trim();
  const person2 = [parts.marie2_prenom, parts.marie2_nom]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (person1 && person2) return `${person1} & ${person2}`;
  if (person1) return person1;
  if (person2) return person2;
  if (parts.nom_des_maries?.trim()) return parts.nom_des_maries.trim();
  if (parts.nom_evenement?.trim()) return parts.nom_evenement.trim();
  return "";
}

export function parseEventFormData(
  formData: FormData,
  customTypes: CustomEventType[] = [],
) {
  const type_evenement = String(formData.get("type_evenement") || "mariage");
  const marie1_prenom = String(formData.get("marie1_prenom") ?? "").trim();
  const marie1_nom = String(formData.get("marie1_nom") ?? "").trim();
  const marie2_prenom = String(formData.get("marie2_prenom") ?? "").trim();
  const marie2_nom = String(formData.get("marie2_nom") ?? "").trim();

  const coupleName = buildCoupleDisplayName({
    marie1_prenom,
    marie1_nom,
    marie2_prenom,
    marie2_nom,
  });

  let nom_evenement = String(formData.get("nom_evenement") ?? "").trim();
  if (!nom_evenement && coupleName) {
    nom_evenement = buildDefaultEventName(
      type_evenement,
      coupleName,
      customTypes,
    );
  }

  const nom_des_maries =
    coupleName ||
    nom_evenement ||
    String(formData.get("nom_des_maries") ?? "").trim();

  const montantAcompte = Number(formData.get("montant_acompte") || 0);
  const montantSolde = Number(formData.get("montant_solde") || 0);
  const prix_total = Number(formData.get("prix_total") || 0);
  const hasCustomSplit = montantAcompte > 0 && montantSolde > 0;

  return {
    type_evenement,
    nom_evenement,
    nom_des_maries,
    marie1_prenom,
    marie1_nom,
    marie2_prenom,
    marie2_nom,
    adresse_postale: String(formData.get("adresse_postale") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telephone: String(formData.get("telephone") ?? "").trim(),
    notes_internes: String(formData.get("notes_internes") ?? "").trim(),
    date_debut: String(formData.get("date_debut") || "").trim() || null,
    date_fin: String(formData.get("date_fin") || "").trim() || null,
    prix_total: hasCustomSplit ? montantAcompte + montantSolde : prix_total,
    montantAcompte: hasCustomSplit ? montantAcompte : 0,
    montantSolde: hasCustomSplit ? montantSolde : 0,
    hasCustomSplit,
  };
}

export function isPostLeadStatus(statut: string): boolean {
  return statut !== "prospect";
}
