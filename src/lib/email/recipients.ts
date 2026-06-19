/** Redirige tous les emails vers une adresse de test (dev). Retirer en prod. */
const TEST_OVERRIDE = process.env.EMAIL_TEST_OVERRIDE?.trim() || null;

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

export function isEmailTestMode(): boolean {
  return Boolean(TEST_OVERRIDE);
}
