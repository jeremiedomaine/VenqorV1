import type { SendDepositPaymentResult } from "@/lib/deposit-payment-email";

export function depositEmailUserMessage(
  result: SendDepositPaymentResult,
): string | null {
  if (result.ok && !result.skipped && !result.alreadySent) {
    return null;
  }

  if (result.error) {
    return result.reason
      ? `${result.error} ${result.reason}`
      : result.error;
  }

  if (result.reason) {
    return result.reason;
  }

  if (result.alreadySent) {
    return "L'email acompte avait déjà été envoyé.";
  }

  return "L'email acompte n'a pas été envoyé automatiquement.";
}
