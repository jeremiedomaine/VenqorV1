/** Deux signataires avec la même adresse : alias +signataire2 pour la boîte commune. */
export function distinctSignerEmails(
  sharedEmail: string,
): [string, string] {
  const trimmed = sharedEmail.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return [trimmed, trimmed];
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  return [trimmed, `${local}+signataire2@${domain}`];
}

export function formatSignerName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
