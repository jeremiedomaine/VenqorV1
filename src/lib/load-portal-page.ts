import type { PortalUnavailableReason } from "@/lib/portal-access";
import { createClient } from "@/lib/supabase/server";
import type { PortalData } from "@/lib/types";

type PortalPageResult =
  | { status: "ok"; data: PortalData }
  | { status: "unavailable"; reason: PortalUnavailableReason }
  | { status: "error" };

export async function loadPortalPage(token: string): Promise<PortalPageResult> {
  const supabase = createClient();

  const { data: reason } = await supabase.rpc("fetch_portal_unavailable_reason", {
    p_token: token,
  });

  if (reason) {
    return {
      status: "unavailable",
      reason: reason as PortalUnavailableReason,
    };
  }

  const { data, error } = await supabase.rpc("fetch_portal_data", {
    p_token: token,
  });

  if (error || !data) return { status: "error" };

  return { status: "ok", data: data as PortalData };
}

export type { PortalPageResult };
