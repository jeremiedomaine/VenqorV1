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
import { requireWorkspaceClient } from "@/lib/workspace-session";

export type CautionEmailResult = ActionResult & {
  sentTo?: string;
  testMode?: boolean;
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

export async function sendCautionSwiklyEmail(input: {
  couple: string;
  email: string;
  amount: number;
  arrivalDate: string;
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
  const swiklyUrl = demoSwiklyUrl(input.amount, input.couple);

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

export async function sendCautionEdlEmail(input: {
  couple: string;
  email: string;
  kind: "entree" | "sortie";
  fileName?: string;
  sejourId: string;
}): Promise<CautionEmailResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const to = emailForCouple(input.email);
  if (!to) {
    return actionError(
      "Ajoutez un email sur le séjour avant d'envoyer l'état des lieux.",
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine, contact_email")
    .eq("id", workspaceId)
    .single();

  const domainName = workspace?.nom_domaine ?? "Votre domaine";
  const kindLabel = input.kind === "entree" ? "entrée" : "sortie";

  const result = await sendTrackedEmail({
    category: "caution_edl",
    workspaceId,
    to,
    subject: `${domainName} — État des lieux ${kindLabel} enregistré`,
    html: buildEdlCoupleEmailHtml({
      domainName,
      couple: input.couple,
      kind: input.kind,
      fileName: input.fileName,
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
