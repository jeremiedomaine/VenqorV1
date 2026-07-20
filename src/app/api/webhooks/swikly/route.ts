import { createServiceClient } from "@/lib/supabase/service";
import {
  mapSwiklyDepositToCautionStatus,
  parseSwiklyWebhookPayload,
  verifySwiklySignature,
} from "@/lib/swikly/webhooks";

export const dynamic = "force-dynamic";

/** Swikly / health-check */
export async function GET() {
  return Response.json({ ok: true, service: "venqor-swikly-webhook" });
}

/**
 * Callback Swikly — à configurer dans le dashboard :
 * https://app.venqor.app/api/webhooks/swikly
 */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const secret = process.env.SWIKLY_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("swikly-signature") ?? "";

  if (secret) {
    const ok = verifySwiklySignature({
      secret,
      signatureHeader: signature,
      rawBody,
    });
    if (!ok) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[swikly-webhook] SWIKLY_WEBHOOK_SECRET manquant");
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSwiklyWebhookPayload(payload);
  const supabase = createServiceClient();

  if (parsed.requestId) {
    const patch = {
      deposit_status: parsed.depositStatus ?? null,
      last_event: parsed.event ?? "callback",
      raw_last_payload: payload,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("caution_swikly_requests")
      .select("id, sejour_id")
      .eq("swikly_request_id", parsed.requestId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("caution_swikly_requests")
        .update(patch)
        .eq("id", existing.id);
    } else if (parsed.customId) {
      await supabase
        .from("caution_swikly_requests")
        .update(patch)
        .eq("sejour_id", parsed.customId);
    }
  }

  const mapped = mapSwiklyDepositToCautionStatus(parsed.depositStatus);
  console.info("[swikly-webhook]", {
    requestId: parsed.requestId,
    customId: parsed.customId,
    depositStatus: parsed.depositStatus,
    mapped,
  });

  return Response.json({ ok: true, mapped });
}
