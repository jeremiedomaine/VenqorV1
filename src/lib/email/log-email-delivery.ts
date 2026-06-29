import type { EmailCategory } from "@/lib/email/email-categories";
import { createServiceClient } from "@/lib/supabase/service";

export type EmailDeliveryStatus = "sent" | "skipped" | "failed";

export interface EmailLogRow {
  id: string;
  workspace_id: string | null;
  category: EmailCategory;
  recipient: string;
  subject: string;
  status: EmailDeliveryStatus;
  error_message: string | null;
  attempt_count: number;
  event_id: string | null;
  payment_id: string | null;
  created_at: string;
}

export async function wasEmailAlreadySent(
  workspaceId: string,
  idempotencyKey: string,
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "sent")
    .maybeSingle();

  return Boolean(data);
}

export async function logEmailDelivery(params: {
  workspaceId?: string | null;
  category: EmailCategory;
  recipient: string;
  subject: string;
  status: EmailDeliveryStatus;
  errorMessage?: string;
  attemptCount: number;
  eventId?: string | null;
  paymentId?: string | null;
  idempotencyKey?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("email_logs").insert({
    workspace_id: params.workspaceId ?? null,
    category: params.category,
    recipient: params.recipient,
    subject: params.subject,
    status: params.status,
    error_message: params.errorMessage ?? null,
    attempt_count: params.attemptCount,
    event_id: params.eventId ?? null,
    payment_id: params.paymentId ?? null,
    idempotency_key: params.idempotencyKey ?? null,
  });

  if (error) {
    console.error("[email-log]", error.message);
  }
}
