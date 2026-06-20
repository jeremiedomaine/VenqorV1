import { NextResponse } from "next/server";
import { loadContractPdfForWorkspace } from "@/lib/contrat-template";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("contrat_template_path")
    .eq("id", profile.workspace_id)
    .single();

  const serviceSupabase = createServiceClient();
  const contractPdf = await loadContractPdfForWorkspace(
    serviceSupabase,
    profile.workspace_id,
    workspace?.contrat_template_path,
  );

  return new NextResponse(new Uint8Array(contractPdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
