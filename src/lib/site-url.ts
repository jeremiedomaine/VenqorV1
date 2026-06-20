const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * URL publique de l'app (emails, liens portail).
 * Fallback Vercel si NEXT_PUBLIC_SITE_URL absent ou localhost en prod.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !LOCALHOST.test(configured)) {
    return normalizeBaseUrl(configured);
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return normalizeBaseUrl(`https://${vercelProduction}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeBaseUrl(`https://${vercelUrl}`);
  }

  return configured ? normalizeBaseUrl(configured) : "";
}
