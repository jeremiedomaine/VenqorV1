/** Code d'invitation requis pour créer un compte (variable d'env, jamais côté client). */
export function getSignupInviteCode(): string {
  return process.env.SIGNUP_INVITE_CODE ?? "VENQOR2026";
}

export function isValidSignupInviteCode(code: string): boolean {
  const expected = getSignupInviteCode();
  if (!expected) return false;
  return code.trim() === expected;
}
