import { maybeSendDepositAfterContract } from "@/lib/deposit-payment-email";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type SignableWebhookMeta = {
  venqor_event_id?: string;
  venqor_workspace_id?: string;
};

function parseMeta(raw: FormDataEntryValue | null): SignableWebhookMeta {
  if (!raw || typeof raw !== "string") return {};
  try {
    return JSON.parse(raw) as SignableWebhookMeta;
  } catch {
    return {};
  }
}

async function findEventByEnvelope(
  supabase: ReturnType<typeof createServiceClient>,
  envelopeFingerprint: string,
  meta: SignableWebhookMeta,
) {
  if (meta.venqor_event_id) {
    const { data } = await supabase
      .from("events")
      .select("id, workspace_id, contrat_signatures_done, contrat_signatures_total, contrat_statut")
      .eq("id", meta.venqor_event_id)
      .maybeSingle();
    if (data) return data;
  }

  const { data } = await supabase
    .from("events")
    .select("id, workspace_id, contrat_signatures_done, contrat_signatures_total, contrat_statut")
    .eq("esign_envelope_id", envelopeFingerprint)
    .maybeSingle();

  return data;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const action = String(form.get("action") ?? "").trim();
  const envelopeFingerprint = String(form.get("envelope_fingerprint") ?? "").trim();
  const meta = parseMeta(form.get("envelope_meta"));

  if (!action || !envelopeFingerprint) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (action === "signed-envelope") {
    const event = await findEventByEnvelope(supabase, envelopeFingerprint, meta);

    if (event?.contrat_statut === "en_cours") {
      const total = event.contrat_signatures_total ?? 2;
      const nextDone = Math.min((event.contrat_signatures_done ?? 0) + 1, total);

      await supabase
        .from("events")
        .update({ contrat_signatures_done: nextDone })
        .eq("id", event.id);
    }
  }

  if (action === "signed-envelope-complete") {
    const event = await findEventByEnvelope(supabase, envelopeFingerprint, meta);

    if (event) {
      const total = event.contrat_signatures_total ?? 2;

      await supabase
        .from("events")
        .update({
          contrat_statut: "signe",
          contrat_signe_at: new Date().toISOString(),
          contrat_signatures_done: total,
        })
        .eq("id", event.id);

      await maybeSendDepositAfterContract({
        supabase,
        eventId: event.id,
        workspaceId: event.workspace_id,
        timing: "after_contract",
      });
    }
  }

  if (action === "rejected-envelope") {
    await supabase
      .from("events")
      .update({
        contrat_statut: "refuse",
        contrat_signatures_done: 0,
      })
      .eq("esign_envelope_id", envelopeFingerprint);
  }

  if (action === "cancelled-envelope" || action === "expired-envelope") {
    await supabase
      .from("events")
      .update({
        contrat_statut: "expire",
        contrat_signatures_done: 0,
      })
      .eq("esign_envelope_id", envelopeFingerprint);
  }

  return Response.json({ received: true });
}
