"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isVenqorAdminEmail } from "@/lib/venqor-admin";
import {
  clearImpersonatedWorkspaceCookie,
  setImpersonatedWorkspaceCookie,
} from "@/lib/workspace-session";

async function assertVenqorAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isVenqorAdminEmail(user.email)) {
    throw new Error("Accès refusé");
  }
  return user;
}

export async function enterWorkspaceAsAdmin(formData: FormData): Promise<void> {
  await assertVenqorAdmin();

  const workspaceId = String(formData.get("workspace_id") ?? "").trim();
  if (!workspaceId) redirect("/admin");

  const service = createServiceClient();
  const { data: workspace } = await service
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) redirect("/admin");

  setImpersonatedWorkspaceCookie(workspaceId);
  redirect("/");
}

export async function exitAdminImpersonation(): Promise<void> {
  await assertVenqorAdmin();
  clearImpersonatedWorkspaceCookie();
  redirect("/admin");
}
