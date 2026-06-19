import type { CustomEventType } from "@/lib/types";

export const BUILTIN_EVENT_TYPES = {
  mariage: "Mariage",
  autre: "Autre événement",
} as const;

export type BuiltinEventTypeSlug = keyof typeof BUILTIN_EVENT_TYPES;

export const RESERVED_EVENT_TYPE_SLUGS = new Set<string>([
  "mariage",
  "autre",
]);

export function slugifyEventType(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);

  return slug || "type";
}

export function parseCustomEventTypes(raw: unknown): CustomEventType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is CustomEventType =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CustomEventType).slug === "string" &&
        typeof (item as CustomEventType).label === "string",
    )
    .filter((item) => !RESERVED_EVENT_TYPE_SLUGS.has(item.slug));
}

export function listEventTypeOptions(
  customTypes: CustomEventType[],
): Array<{ slug: string; label: string; builtin: boolean }> {
  const builtins = Object.entries(BUILTIN_EVENT_TYPES).map(([slug, label]) => ({
    slug,
    label,
    builtin: true,
  }));
  const customs = customTypes.map((t) => ({
    slug: t.slug,
    label: t.label,
    builtin: false,
  }));
  return [...builtins, ...customs];
}

export function getEventTypeLabel(
  slug: string,
  customTypes: CustomEventType[] = [],
): string {
  if (slug in BUILTIN_EVENT_TYPES) {
    return BUILTIN_EVENT_TYPES[slug as BuiltinEventTypeSlug];
  }
  const custom = customTypes.find((t) => t.slug === slug);
  if (custom) return custom.label;
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isMariageType(slug: string): boolean {
  return slug === "mariage";
}

export function buildDefaultEventName(
  typeSlug: string,
  coupleName: string,
  customTypes: CustomEventType[] = [],
): string {
  if (!coupleName) return "";
  const label = getEventTypeLabel(typeSlug, customTypes);
  const prefix = typeSlug === "autre" ? "Événement" : label;
  return `${prefix} ${coupleName}`;
}
