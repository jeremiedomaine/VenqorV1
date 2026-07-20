/**
 * Client Swikly API v2.
 * SWIKLY_ENV=sandbox → api.sandbox.swikly.com (gratuit / tests)
 * SWIKLY_ENV=production → api.v2.swikly.com
 * Montants en centimes (500 € → 50000).
 */

const BASE_BY_ENV = {
  sandbox: "https://api.sandbox.swikly.com/v1",
  production: "https://api.v2.swikly.com/v1",
} as const;

export type SwiklyDepositRequest = {
  id: string;
  link: string;
  email?: string | null;
  deposit?: {
    amount: number;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
};

function resolveEnv(): "sandbox" | "production" {
  const raw = (process.env.SWIKLY_ENV ?? "sandbox").trim().toLowerCase();
  if (raw === "production" || raw === "prod" || raw === "live") {
    return "production";
  }
  return "sandbox";
}

function getConfig() {
  const apiKey = process.env.SWIKLY_API_KEY?.trim();
  const accountId = process.env.SWIKLY_ACCOUNT_ID?.trim();
  const env = resolveEnv();
  const baseUrl = (
    process.env.SWIKLY_API_BASE?.trim() || BASE_BY_ENV[env]
  ).replace(/\/$/, "");
  return { apiKey, accountId, baseUrl, env };
}

export function isSwiklyConfigured(): boolean {
  const { apiKey, accountId } = getConfig();
  return Boolean(apiKey && accountId);
}

export function getSwiklyEnv(): "sandbox" | "production" {
  return getConfig().env;
}

async function swiklyFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    return { ok: false, error: "SWIKLY_API_KEY manquante." };
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Venqor/1.0",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message =
      json &&
      typeof json === "object" &&
      "message" in json &&
      typeof (json as { message: unknown }).message === "string"
        ? (json as { message: string }).message
        : `Swikly HTTP ${res.status}`;
    return { ok: false, error: message };
  }

  return { ok: true, data: json as T };
}

/** Découpe grossière "Léa & Maxime" → prénom / nom pour Swikly. */
export function splitCoupleName(couple: string): {
  firstName: string;
  lastName: string;
} {
  const cleaned = couple.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/\s*[&+]\s*|\s+et\s+/i);
  if (parts.length >= 2) {
    return {
      firstName: parts[0]!.trim() || "Client",
      lastName: parts.slice(1).join(" ").trim() || "Venqor",
    };
  }
  const words = cleaned.split(" ");
  if (words.length >= 2) {
    return {
      firstName: words[0]!,
      lastName: words.slice(1).join(" "),
    };
  }
  return { firstName: cleaned || "Client", lastName: "Venqor" };
}

export async function createSwiklyDepositRequest(input: {
  couple: string;
  email: string;
  amountEuros: number;
  startDate: string;
  endDate: string;
  description: string;
  /** false = Venqor envoie le mail ; true = Swikly envoie aussi */
  sendEmail?: boolean;
}): Promise<
  { ok: true; request: SwiklyDepositRequest } | { ok: false; error: string }
> {
  const { accountId } = getConfig();
  if (!isSwiklyConfigured() || !accountId) {
    return { ok: false, error: "Swikly non configuré (clé / account id)." };
  }

  const amountCents = Math.round(input.amountEuros * 100);
  if (amountCents < 100) {
    return { ok: false, error: "Montant Swikly trop bas." };
  }

  const { firstName, lastName } = splitCoupleName(input.couple);

  const result = await swiklyFetch<{ request: SwiklyDepositRequest }>(
    `/accounts/${accountId}/requests`,
    {
      method: "POST",
      body: JSON.stringify({
        description: input.description,
        language: "fr",
        firstName,
        lastName,
        email: input.email,
        sendEmail: input.sendEmail ?? false,
        deposit: {
          startDate: input.startDate,
          endDate: input.endDate,
          amount: amountCents,
        },
      }),
    },
  );

  if (!result.ok) return result;
  const request = result.data?.request;
  if (!request?.link) {
    return { ok: false, error: "Réponse Swikly sans lien." };
  }
  return { ok: true, request };
}
