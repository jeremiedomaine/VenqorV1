const DEFAULT_BASE = "https://api.signable.co.uk/v1";

export class SignableError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "SignableError";
  }
}

function getConfig() {
  const apiKey = process.env.SIGNABLE_API_KEY?.trim();
  const baseUrl = (process.env.SIGNABLE_API_BASE?.trim() || DEFAULT_BASE).replace(
    /\/$/,
    "",
  );

  if (!apiKey) {
    throw new Error("SIGNABLE_API_KEY manquant");
  }

  const auth = Buffer.from(`${apiKey}:x`).toString("base64");
  return { auth, baseUrl };
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

function formatSignableError(body: unknown, status: number): string {
  if (typeof body !== "object" || body === null) {
    return `Erreur Signable (${status})`;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return `Erreur Signable (${status})`;
}

async function signableFetch(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const { auth, baseUrl } = getConfig();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Basic ${auth}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new SignableError(
      formatSignableError(body, response.status),
      response.status,
      body,
    );
  }

  return body;
}

export type SignableParty = {
  party_name: string;
  party_email: string;
  party_role: "signer";
};

export type SendSignableEnvelopeInput = {
  title: string;
  parties: SignableParty[];
  pdfBytes: Buffer;
  pdfFilename: string;
  documentTitle?: string;
  meta?: Record<string, string>;
};

export type SendSignableEnvelopeResult = {
  envelopeFingerprint: string;
};

function extractEnvelopeFingerprint(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    throw new SignableError("Réponse Signable invalide", 500, body);
  }

  const record = body as { envelope_fingerprint?: string; href?: string };

  if (record.envelope_fingerprint?.trim()) {
    return record.envelope_fingerprint.trim();
  }

  if (record.href) {
    const match = record.href.match(/\/envelopes\/([a-f0-9]{32})/i);
    if (match?.[1]) return match[1];
  }

  throw new SignableError(
    "Signable n'a pas renvoyé d'identifiant d'enveloppe",
    500,
    body,
  );
}

export async function sendSignableEnvelope(
  input: SendSignableEnvelopeInput,
): Promise<SendSignableEnvelopeResult> {
  const payload = {
    envelope_title: input.title.slice(0, 120),
    envelope_parties: input.parties,
    envelope_documents: [
      {
        document_title: input.documentTitle ?? "Contrat de réservation",
        document_file_name: input.pdfFilename,
        document_file_content: input.pdfBytes.toString("base64"),
      },
    ],
    ...(input.meta
      ? { envelope_meta: JSON.stringify(input.meta) }
      : {}),
  };

  const body = await signableFetch("/envelopes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return { envelopeFingerprint: extractEnvelopeFingerprint(body) };
}

export function isSignableConfigured(): boolean {
  return Boolean(process.env.SIGNABLE_API_KEY?.trim());
}
