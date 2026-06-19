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
    const message =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof (body as { detail: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : `Erreur Yousign (${response.status})`;
    throw new YousignError(message, response.status, body);
  }

  return body;
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
) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
    filename,
  );
  form.append("nature", "signable_document");
  form.append("parse_anchors", "true");

  const body = await yousignFetch(
    `/signature_requests/${signatureRequestId}/documents`,
    { method: "POST", body: form },
  );

  const id = (body as { id?: string }).id;
  if (!id) throw new YousignError("Document Yousign invalide", 500, body);
  return id;
}

export async function addSigner(
  signatureRequestId: string,
  info: YousignSignerInfo,
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
