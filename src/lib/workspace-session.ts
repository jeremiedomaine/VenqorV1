import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isVenqorAdminEmail } from "@/lib/venqor-admin";

export const ADMIN_WORKSPACE_COOKIE = "venqor_admin_workspace_id";

export type WorkspaceSession = {
  userId: string;
  email: string;
  workspaceId: string;
  isVenqorAdmin: boolean;
  isImpersonating: boolean;
};

export function getImpersonatedWorkspaceIdFromCookies(): string | null {
  const value = cookies().get(ADMIN_WORKSPACE_COOKIE)?.value?.trim();
  return value || null;
}

export async function getWorkspaceSession(): Promise<WorkspaceSession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const isVenqorAdmin = isVenqorAdminEmail(user.email);
  const impersonatedId = isVenqorAdmin
    ? getImpersonatedWorkspaceIdFromCookies()
    : null;

  if (isVenqorAdmin && impersonatedId) {
    const service = createServiceClient();
    const { data: workspace } = await service
      .from("workspaces")
      .select("id")
      .eq("id", impersonatedId)
      .maybeSingle();

    if (workspace) {
      return {
        userId: user.id,
        email: user.email ?? "",
        workspaceId: impersonatedId,
        isVenqorAdmin: true,
        isImpersonating: true,
      };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    workspaceId: profile.workspace_id,
    isVenqorAdmin,
    isImpersonating: false,
  };
}

export async function requireWorkspaceSession(): Promise<WorkspaceSession> {
  const session = await getWorkspaceSession();
  if (!session) throw new Error("Non authentifié");
  return session;
}

export async function requireWorkspaceId(): Promise<string> {
  const session = await requireWorkspaceSession();
  return session.workspaceId;
}

export async function createScopedClient(): Promise<SupabaseClient> {
  const session = await requireWorkspaceSession();
  if (session.isImpersonating) return createServiceClient();
  return createClient();
}

export async function requireWorkspaceClient(): Promise<{
  session: WorkspaceSession;
  workspaceId: string;
  supabase: SupabaseClient;
}> {
  const session = await requireWorkspaceSession();
  const supabase = session.isImpersonating
    ? createServiceClient()
    : createClient();

  return {
    session,
    workspaceId: session.workspaceId,
    supabase,
  };
}

export function setImpersonatedWorkspaceCookie(workspaceId: string): void {
  cookies().set(ADMIN_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function clearImpersonatedWorkspaceCookie(): void {
  cookies().delete(ADMIN_WORKSPACE_COOKIE);
}
