import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Venqor <onboarding@resend.dev>";
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email:dev]", {
        to: input.to,
        subject: input.subject,
        replyTo: input.replyTo,
      });
      return { ok: true, skipped: true };
    }
    return {
      ok: false,
      error: "RESEND_API_KEY non configurée.",
    };
  }

  if (!input.to?.trim()) {
    return { ok: false, error: "Destinataire email manquant." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo || undefined,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
