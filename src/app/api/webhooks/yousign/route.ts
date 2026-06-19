import { createHmac, timingSafeEqual } from "crypto";
import { maybeSendDepositAfterContract } from "@/lib/deposit-payment-email";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type YousignWebhookPayload = {
  event_id?: string;
  event_name?: string;
  data?: {
    signature_request?: {
      id?: string;
      status?: string;
    };
  };
};

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  if (!signatureHeader) return false;

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(`sha256=${digest}`, "utf8");
  const received = Buffer.from(signatureHeader, "utf8");

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-yousign-signature-256");

  if (process.env.YOUSIGN_WEBHOOK_SECRET?.trim()) {
    if (!verifySignature(rawBody, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: YousignWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as YousignWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.event_name;
  const signatureRequestId = payload.data?.signature_request?.id;

  if (
    eventName === "signature_request.done" &&
    signatureRequestId &&
    payload.data?.signature_request?.status === "done"
  ) {
    const supabase = createServiceClient();
    const { data: event } = await supabase
      .from("events")
      .update({
        contrat_statut: "signe",
        contrat_signe_at: new Date().toISOString(),
      })
      .eq("yousign_signature_request_id", signatureRequestId)
      .select("id, workspace_id")
      .maybeSingle();

    if (event) {
      await maybeSendDepositAfterContract({
        supabase,
        eventId: event.id,
        workspaceId: event.workspace_id,
        timing: "after_contract",
      });
    }
  }

  if (eventName === "signature_request.declined") {
    const supabase = createServiceClient();
    await supabase
      .from("events")
      .update({ contrat_statut: "refuse" })
      .eq("yousign_signature_request_id", signatureRequestId ?? "");
  }

  if (eventName === "signature_request.expired") {
    const supabase = createServiceClient();
    await supabase
      .from("events")
      .update({ contrat_statut: "expire" })
      .eq("yousign_signature_request_id", signatureRequestId ?? "");
  }

  return Response.json({ received: true });
}
