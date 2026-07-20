import { createHmac, timingSafeEqual } from "crypto";

/** Vérifie l'en-tête Swikly-Signature : t=<ts>,sha256=<hex> */
export function verifySwiklySignature(input: {
  secret: string;
  signatureHeader: string;
  rawBody: Buffer;
  toleranceSeconds?: number;
}): boolean {
  const tolerance = input.toleranceSeconds ?? 600;
  const parts = Object.fromEntries(
    input.signatureHeader
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("=");
        return i === -1 ? ["", ""] : [p.slice(0, i), p.slice(i + 1)];
      }),
  );

  const ts = parts.t;
  const provided = parts.sha256;
  if (!ts || !provided) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  if (Math.abs(Date.now() / 1000 - tsNum) > tolerance) return false;

  const signed = Buffer.concat([Buffer.from(`${ts}.`, "utf8"), input.rawBody]);
  const expected = createHmac("sha256", input.secret).update(signed).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Mappe un statut dépôt Swikly → statut UI Caution. */
export function mapSwiklyDepositToCautionStatus(
  depositStatus: string | null | undefined,
): "envoye" | "empreinte" | "liberee" | "expiree" | null {
  if (!depositStatus) return null;
  const s = depositStatus.toLowerCase();
  if (
    s.includes("accept") ||
    s.includes("secur") ||
    s === "ok" ||
    s === "active" ||
    s === "validated"
  ) {
    return "empreinte";
  }
  if (s.includes("releas") || s.includes("liber")) {
    return "liberee";
  }
  if (s.includes("expir") || s.includes("cancel") || s.includes("refus")) {
    return "expiree";
  }
  if (s.includes("pend") || s.includes("wait") || s.includes("sent")) {
    return "envoye";
  }
  return null;
}

/** Extrait ids / statut depuis un payload callback Swikly (forme variable). */
export function parseSwiklyWebhookPayload(payload: unknown): {
  requestId?: string;
  customId?: string;
  depositStatus?: string;
  event?: string;
} {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const request =
    root.request && typeof root.request === "object"
      ? (root.request as Record<string, unknown>)
      : root;
  const deposit =
    request.deposit && typeof request.deposit === "object"
      ? (request.deposit as Record<string, unknown>)
      : root.deposit && typeof root.deposit === "object"
        ? (root.deposit as Record<string, unknown>)
        : null;

  const requestId =
    (typeof request.id === "string" && request.id) ||
    (typeof root.requestId === "string" && root.requestId) ||
    undefined;
  const customId =
    (typeof request.customId === "string" && request.customId) ||
    (typeof root.customId === "string" && root.customId) ||
    undefined;
  const depositStatus =
    (deposit && typeof deposit.status === "string" && deposit.status) ||
    (typeof root.status === "string" && root.status) ||
    undefined;
  const event =
    (typeof root.event === "string" && root.event) ||
    (typeof root.type === "string" && root.type) ||
    undefined;

  return { requestId, customId, depositStatus, event };
}
