const DEFAULT_BASE = "https://api-sandbox.yousign.app/v3";

export class YousignError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "YousignError";
  }
}

function getConfig() {
  const apiKey = process.env.YOUSIGN_API_KEY?.trim();
  const baseUrl = (process.env.YOUSIGN_API_BASE?.trim() || DEFAULT_BASE).replace(
    /\/$/,
    "",
  );

  if (!apiKey) {
    throw new Error("YOUSIGN_API_KEY manquant");
  }

  return { apiKey, baseUrl };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function yousignFetch(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const { apiKey, baseUrl } = getConfig();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new YousignError(formatYousignError(body, response.status), response.status, body);
  }

  return body;
}

function formatYousignError(body: unknown, status: number): string {
  if (typeof body !== "object" || body === null) {
    return `Erreur Yousign (${status})`;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }

  if (Array.isArray(record.detail)) {
    const parts = record.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  if (Array.isArray(record.violations)) {
    const parts = record.violations
      .map((v) => {
        if (typeof v !== "object" || v === null) return null;
        const violation = v as { message?: string; propertyPath?: string };
        if (violation.message) return violation.message;
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  if (typeof record.title === "string" && record.title.trim()) {
    return record.title;
  }

  return `Erreur Yousign (${status})`;
}

export type YousignSignerInfo = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  locale?: string;
};

export async function createSignatureRequest(name: string) {
  const body = await yousignFetch("/signature_requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      delivery_mode: "email",
      timezone: "Europe/Paris",
    }),
  });

  const id = (body as { id?: string }).id;
  if (!id) throw new YousignError("Réponse Yousign invalide", 500, body);
  return id;
}

export async function uploadSignableDocument(
  signatureRequestId: string,
  pdfBytes: Buffer,
  filename: string,
  options?: { parseAnchors?: boolean },
): Promise<{ id: string; totalAnchors: number }> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
    filename,
  );
  form.append("nature", "signable_document");
  form.append("parse_anchors", options?.parseAnchors === false ? "false" : "true");

  const body = await yousignFetch(
    `/signature_requests/${signatureRequestId}/documents`,
    { method: "POST", body: form },
  );

  const record = body as { id?: string; total_anchors?: number };
  const id = record.id;
  if (!id) throw new YousignError("Document Yousign invalide", 500, body);
  return { id, totalAnchors: record.total_anchors ?? 0 };
}

export type YousignSignerField = {
  document_id: string;
  type: "signature";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function addSigner(
  signatureRequestId: string,
  info: YousignSignerInfo,
  fields?: YousignSignerField[],
) {
  const payload: Record<string, unknown> = {
    info: {
      first_name: info.first_name,
      last_name: info.last_name,
      email: info.email,
      locale: info.locale ?? "fr",
      ...(info.phone_number ? { phone_number: info.phone_number } : {}),
    },
    signature_level: "electronic_signature",
    signature_authentication_mode: "no_otp",
    ...(fields?.length ? { fields } : {}),
  };

  const body = await yousignFetch(
    `/signature_requests/${signatureRequestId}/signers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const id = (body as { id?: string }).id;
  if (!id) throw new YousignError("Signataire Yousign invalide", 500, body);
  return id;
}

export async function activateSignatureRequest(signatureRequestId: string) {
  return yousignFetch(`/signature_requests/${signatureRequestId}/activate`, {
    method: "POST",
  });
}

export function isYousignConfigured(): boolean {
  return Boolean(process.env.YOUSIGN_API_KEY?.trim());
}
