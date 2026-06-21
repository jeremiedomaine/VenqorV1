import { NextResponse } from "next/server";
import { loadContractPdfForWorkspace } from "@/lib/contrat-template";
import { createServiceClient } from "@/lib/supabase/service";
import { requireWorkspaceClient } from "@/lib/workspace-session";

export async function GET() {
  let workspaceId: string;
  let supabase: Awaited<ReturnType<typeof requireWorkspaceClient>>["supabase"];
  try {
    ({ workspaceId, supabase } = await requireWorkspaceClient());
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("contrat_template_path")
    .eq("id", workspaceId)
    .single();

  const serviceSupabase = createServiceClient();
  const contractPdf = await loadContractPdfForWorkspace(
    serviceSupabase,
    workspaceId,
    workspace?.contrat_template_path,
  );

  return new NextResponse(new Uint8Array(contractPdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
