import type { ContratSignatureZone, ContratSignatureZones } from "@/lib/types";

export type { ContratSignatureZone, ContratSignatureZones };

const MIN_WIDTH = 80;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseZone(value: unknown): ContratSignatureZone | null {
  if (!isRecord(value)) return null;

  const pageRaw = value.page;
  const page =
    pageRaw === "last"
      ? "last"
      : typeof pageRaw === "number" && Number.isInteger(pageRaw) && pageRaw >= 1
        ? pageRaw
        : null;
  if (page === null) return null;

  const x = Number(value.x);
  const y = Number(value.y);
  const width = Number(value.width);
  const height = Number(value.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    x < 0 ||
    y < 0 ||
    width < MIN_WIDTH ||
    width > MAX_WIDTH ||
    height < MIN_HEIGHT ||
    height > MAX_HEIGHT
  ) {
    return null;
  }

  return { page, x, y, width, height };
}

export function parseContratSignatureZones(
  raw: unknown,
): ContratSignatureZones | null {
  if (!isRecord(raw)) return null;

  const signer1 = parseZone(raw.signer1);
  const signer2 = parseZone(raw.signer2);
  if (!signer1 || !signer2) return null;

  return { signer1, signer2 };
}
