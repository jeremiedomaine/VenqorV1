import { createHmac, timingSafeEqual } from "crypto";
import { maybeSendDepositAfterContract } from "@/lib/deposit-payment-email";
import { isProductionRuntime } from "@/lib/is-production";
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
    signer?: {
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
  const webhookSecret = process.env.YOUSIGN_WEBHOOK_SECRET?.trim();

  if (isProductionRuntime() && !webhookSecret) {
    console.error("[yousign/webhook] YOUSIGN_WEBHOOK_SECRET manquant en production");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (webhookSecret) {
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
  const supabase = createServiceClient();

  if (
    eventName === "signer.done" &&
    signatureRequestId &&
    payload.data?.signer?.status === "signed"
  ) {
    const { data: event } = await supabase
      .from("events")
      .select("id, contrat_signatures_done, contrat_signatures_total, contrat_statut")
      .eq("yousign_signature_request_id", signatureRequestId)
      .maybeSingle();

    if (event?.contrat_statut === "en_cours") {
      const total = event.contrat_signatures_total ?? 2;
      const nextDone = Math.min((event.contrat_signatures_done ?? 0) + 1, total);

      await supabase
        .from("events")
        .update({ contrat_signatures_done: nextDone })
        .eq("id", event.id);
    }
  }

  if (
    eventName === "signature_request.done" &&
    signatureRequestId &&
    payload.data?.signature_request?.status === "done"
  ) {
    const { data: existing } = await supabase
      .from("events")
      .select("id, workspace_id, contrat_signatures_total")
      .eq("yousign_signature_request_id", signatureRequestId)
      .maybeSingle();

    if (existing) {
      const total = existing.contrat_signatures_total ?? 2;

      await supabase
        .from("events")
        .update({
          contrat_statut: "signe",
          contrat_signe_at: new Date().toISOString(),
          contrat_signatures_done: total,
        })
        .eq("id", existing.id);

      await maybeSendDepositAfterContract({
        supabase,
        eventId: existing.id,
        workspaceId: existing.workspace_id,
        timing: "after_contract",
      });
    }
  }

  if (eventName === "signature_request.declined") {
    await supabase
      .from("events")
      .update({
        contrat_statut: "refuse",
        contrat_signatures_done: 0,
      })
      .eq("yousign_signature_request_id", signatureRequestId ?? "");
  }

  if (eventName === "signature_request.expired") {
    await supabase
      .from("events")
      .update({
        contrat_statut: "expire",
        contrat_signatures_done: 0,
      })
      .eq("yousign_signature_request_id", signatureRequestId ?? "");
  }

  return Response.json({ received: true });
}
