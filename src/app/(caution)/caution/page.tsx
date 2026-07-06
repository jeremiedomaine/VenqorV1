import { redirect } from "next/navigation";
import { CautionDemoHub } from "@/components/caution/caution-demo-hub";
import { getAuthContext } from "@/lib/auth-context";

export default async function CautionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  return <CautionDemoHub workspaceName={auth.workspaceName} />;
}
