import type { EmailCategory } from "@/lib/email/email-categories";
import {
  logEmailDelivery,
  wasEmailAlreadySent,
} from "@/lib/email/log-email-delivery";
import {
  sendEmail,
  type SendEmailInput,
  type SendEmailResult,
} from "@/lib/email/send-email";

const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TrackedEmailInput extends SendEmailInput {
  category: EmailCategory;
  workspaceId?: string | null;
  eventId?: string | null;
  paymentId?: string | null;
  idempotencyKey?: string | null;
  retries?: number;
}

export async function sendTrackedEmail(
  input: TrackedEmailInput,
): Promise<SendEmailResult> {
  const {
    category,
    workspaceId,
    eventId,
    paymentId,
    idempotencyKey,
    retries = DEFAULT_RETRIES,
    ...mail
  } = input;

  if (workspaceId && idempotencyKey) {
    const alreadySent = await wasEmailAlreadySent(workspaceId, idempotencyKey);
    if (alreadySent) {
      return { ok: true, skipped: true };
    }
  }

  let lastError: string | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= retries; attempt++) {
    attempts = attempt;
    const result = await sendEmail(mail);

    if (result.ok) {
      await logEmailDelivery({
        workspaceId,
        category,
        recipient: mail.to,
        subject: mail.subject,
        status: result.skipped ? "skipped" : "sent",
        attemptCount: attempt,
        eventId,
        paymentId,
        idempotencyKey,
      });
      return result;
    }

    lastError = result.error;
    if (attempt < retries) {
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  await logEmailDelivery({
    workspaceId,
    category,
    recipient: mail.to,
    subject: mail.subject,
    status: "failed",
    errorMessage: lastError,
    attemptCount: attempts,
    eventId,
    paymentId,
    idempotencyKey,
  });

  return { ok: false, error: lastError };
}
