import type { EmailLogRow } from "@/lib/email/log-email-delivery";
import { createClient } from "@/lib/supabase/server";

export async function loadRecentEmailLogs(
  workspaceId: string,
  limit = 10,
): Promise<EmailLogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as EmailLogRow[];
}

export async function loadRecentEmailFailureCount(
  workspaceId: string,
  sinceDays = 7,
): Promise<number> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const { count, error } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "failed")
    .gte("created_at", since.toISOString());

  if (error) return 0;
  return count ?? 0;
}
