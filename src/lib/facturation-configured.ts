import type { Workspace } from "@/lib/types";

export function isFacturationConfigured(
  workspace: Pick<Workspace, "facturation_configuree">,
): boolean {
  return workspace.facturation_configuree === true;
}

export function needsOnboarding(
  workspace: Pick<Workspace, "onboarding_completed_at">,
): boolean {
  return !workspace.onboarding_completed_at;
}
