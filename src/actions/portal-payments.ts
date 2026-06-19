"use server";

import { revalidatePath } from "next/cache";
import { notifyPaymentDeclaredFromPortal } from "@/actions/payment-emails";
import { createClient } from "@/lib/supabase/server";
import { runInBackground } from "@/lib/run-in-background";

export async function declarePortalPayment(
  portalToken: string,
  paymentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("declare_portal_payment", {
    p_token: portalToken,
    p_payment_id: paymentId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as { ok?: boolean; error?: string };
  if (!result?.ok) {
    return {
      ok: false,
      error:
        result.error === "invalid_state"
          ? "Ce paiement ne peut pas être déclaré."
          : "Lien invalide ou expiré.",
    };
  }

  revalidatePath(`/portail/${portalToken}`);
  revalidatePath("/");
  runInBackground(notifyPaymentDeclaredFromPortal(portalToken, paymentId));
  return { ok: true };
}
