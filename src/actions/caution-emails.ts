"use server";

import { actionError, type ActionResult } from "@/lib/action-result";
import {
  buildEdlCoupleEmailHtml,
  buildSwiklyCautionEmailHtml,
} from "@/lib/email/caution-templates";
import {
  emailForCouple,
  isEmailTestMode,
} from "@/lib/email/recipients";
import { sendTrackedEmail } from "@/lib/email/send-tracked-email";
import {
  createSwiklyDepositRequest,
  isSwiklyConfigured,
} from "@/lib/swikly/client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireWorkspaceClient } from "@/lib/workspace-session";

const CAUTION_EDL_BUCKET = "caution-edl";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours

type CautionEmailResult = ActionResult & {
  sentTo?: string;
  testMode?: boolean;
  downloadUrl?: string;
};

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** Lien Swikly réel à brancher plus tard ; placeholder démo pour le CTA email. */
function demoSwiklyUrl(amount: number, couple: string): string {
  const params = new URLSearchParams({
    demo: "1",
    amount: String(amount),
    couple,
  });
  return `${siteBaseUrl()}/caution?swikly=${encodeURIComponent(params.toString())}`;
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "edl.mp4";
}

async function uploadEdlVideo(input: {
  workspaceId: string;
  sejourId: string;
  kind: "entree" | "sortie";
  file: File;
}): Promise<{ path: string; downloadUrl: string } | { error: string }> {
  const service = createServiceClient();
  const fileName = safeFileName(input.file.name || `edl-${input.kind}.mp4`);
  const path = `${input.workspaceId}/${input.sejourId}/${input.kind}-${Date.now()}-${fileName}`;

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const contentType = input.file.type || "video/mp4";

  const { error: uploadError } = await service.storage
    .from(CAUTION_EDL_BUCKET)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: signed, error: signError } = await service.storage
    .from(CAUTION_EDL_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, {
      download: fileName,
    });

  if (signError || !signed?.signedUrl) {
    return {
      error: signError?.message ?? "Impossible de créer le lien de téléchargement.",
    };
  }

  return { path, downloadUrl: signed.signedUrl };
}

export async function sendCautionSwiklyEmail(input: {
  couple: string;
  email: string;
  amount: number;
  arrivalDate: string;
  departureDate: string;
  sejourId: string;
}): Promise<CautionEmailResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const to = emailForCouple(input.email);
  if (!to) {
    return actionError(
      "Ajoutez un email sur le séjour avant d'envoyer le lien Swikly.",
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine, contact_email")
    .eq("id", workspaceId)
    .single();

  const domainName = workspace?.nom_domaine ?? "Votre domaine";

  let swiklyUrl = demoSwiklyUrl(input.amount, input.couple);

  if (isSwiklyConfigured()) {
    const created = await createSwiklyDepositRequest({
      couple: input.couple,
      // Destinataire réel du séjour pour Swikly (l'email Venqor peut être override en test)
      email: input.email.trim() || to,
      amountEuros: input.amount,
      startDate: input.arrivalDate,
      endDate: input.departureDate || input.arrivalDate,
      description: `${domainName} — Caution ${input.couple}`,
      sendEmail: false,
    });
    if (!created.ok) {
      return actionError(`Swikly : ${created.error}`);
    }
    swiklyUrl = created.request.link;
  }

  const result = await sendTrackedEmail({
    category: "caution_swikly",
    workspaceId,
    to,
    subject: `${domainName} — Empreinte de caution à valider`,
    html: buildSwiklyCautionEmailHtml({
      domainName,
      couple: input.couple,
      amount: input.amount,
      arrivalDate: input.arrivalDate,
      swiklyUrl,
    }),
    replyTo: workspace?.contact_email || undefined,
  });

  if (!result.ok) {
    return actionError(result.error ?? "Envoi Resend impossible.");
  }

  return {
    sentTo: to,
    testMode: isEmailTestMode(),
  };
}

export async function sendCautionEdlEmail(
  formData: FormData,
): Promise<CautionEmailResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const couple = String(formData.get("couple") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "");
  const sejourId = String(formData.get("sejourId") ?? "").trim();
  const fileNameHint = String(formData.get("fileName") ?? "").trim();
  const video = formData.get("video");

  const kind = kindRaw === "sortie" ? "sortie" : kindRaw === "entree" ? "entree" : null;
  if (!couple || !sejourId || !kind) {
    return actionError("Données séjour incomplètes.");
  }

  const to = emailForCouple(email);
  if (!to) {
    return actionError(
      "Ajoutez un email sur le séjour avant d'envoyer l'état des lieux.",
    );
  }

  let downloadUrl: string | undefined;
  let fileName = fileNameHint || undefined;

  if (video instanceof File && video.size > 0) {
    fileName = video.name || fileName;
    const uploaded = await uploadEdlVideo({
      workspaceId,
      sejourId,
      kind,
      file: video,
    });
    if ("error" in uploaded) {
      return actionError(`Upload vidéo : ${uploaded.error}`);
    }
    downloadUrl = uploaded.downloadUrl;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine, contact_email")
    .eq("id", workspaceId)
    .single();

  const domainName = workspace?.nom_domaine ?? "Votre domaine";
  const kindLabel = kind === "entree" ? "entrée" : "sortie";

  const result = await sendTrackedEmail({
    category: "caution_edl",
    workspaceId,
    to,
    subject: `${domainName} — État des lieux ${kindLabel} enregistré`,
    html: buildEdlCoupleEmailHtml({
      domainName,
      couple,
      kind,
      fileName,
      downloadUrl,
    }),
    replyTo: workspace?.contact_email || undefined,
  });

  if (!result.ok) {
    return actionError(result.error ?? "Envoi Resend impossible.");
  }

  return {
    sentTo: to,
    testMode: isEmailTestMode(),
    downloadUrl,
  };
}
