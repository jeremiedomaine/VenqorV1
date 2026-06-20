/** Redirige tous les emails vers une adresse de test (dev uniquement). */
import { isProductionRuntime } from "@/lib/is-production";

const TEST_OVERRIDE = isProductionRuntime()
  ? null
  : process.env.EMAIL_TEST_OVERRIDE?.trim() || null;

export function emailForCouple(actual: string | null | undefined): string | null {
  if (TEST_OVERRIDE) return TEST_OVERRIDE;
  const trimmed = actual?.trim();
  return trimmed || null;
}

export function emailForDomain(actual: string | null | undefined): string | null {
  if (TEST_OVERRIDE) return TEST_OVERRIDE;
  const trimmed = actual?.trim();
  return trimmed || null;
}

/** Email test automatisations — toujours l'adresse réelle du domaine. */
export function emailForTestPreview(
  actual: string | null | undefined,
): string | null {
  const trimmed = actual?.trim();
  return trimmed || null;
}

export function isEmailTestMode(): boolean {
  return Boolean(TEST_OVERRIDE);
}
