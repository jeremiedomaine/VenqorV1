/** Utilitaires dédiés au portail mariés (Silent Luxury) */

export function parseCoupleNames(nom: string): { first: string; second: string | null } {
  const separators = [" & ", " et ", " ET ", " + "];
  for (const sep of separators) {
    if (nom.includes(sep)) {
      const [a, b] = nom.split(sep);
      return {
        first: a.trim(),
        second: b?.trim() || null,
      };
    }
  }
  return { first: nom.trim(), second: null };
}

export function formatDateLong(date: string | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateRange(
  debut: string | null | undefined,
  fin: string | null | undefined,
): string | null {
  if (!debut) return null;
  if (!fin || fin === debut) return formatDateLong(debut);
  const d1 = formatDateShort(debut);
  const d2 = formatDateShort(fin);
  return d1 && d2 ? `Du ${d1} au ${d2}` : formatDateLong(debut);
}

export function workspaceMonogram(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
