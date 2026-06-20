import type { EventStatus } from "@/lib/types";

export const RELANCE_EVENT_STATUSES: EventStatus[] = [
  "prospect",
  "option",
  "confirme",
];

/** Libellés orientés relances (option = étape contrat / date bloquée). */
export const RELANCE_STATUT_LABELS: Record<EventStatus, string> = {
  prospect: "Prospect",
  option: "Date bloquée (contrat)",
  confirme: "Confirmé",
};

export function eventMatchesRelanceFilters(
  event: { type_evenement: string; statut: string },
  rule: { types_evenement: string[]; statuts_evenement: string[] },
): boolean {
  const typesOk =
    !rule.types_evenement.length ||
    rule.types_evenement.includes(event.type_evenement);

  const statutsOk =
    !rule.statuts_evenement.length ||
    rule.statuts_evenement.includes(event.statut);

  return typesOk && statutsOk;
}

export function parseRelanceStringArray(raw: FormDataEntryValue | null): string[] {
  const value = String(raw ?? "").trim();
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
