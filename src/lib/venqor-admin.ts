/** Emails autorisés à configurer les contrats (équipe Venqor). */
export function getVenqorAdminEmails(): string[] {
  return (process.env.VENQOR_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isVenqorAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getVenqorAdminEmails().includes(email.trim().toLowerCase());
}
