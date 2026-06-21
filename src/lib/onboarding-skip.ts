export function onboardingSkipStorageKey(workspaceId: string): string {
  return `venqor-onboarding-skipped:${workspaceId}`;
}

export function readOnboardingSkipped(workspaceId: string): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.localStorage.getItem(onboardingSkipStorageKey(workspaceId)) === "1"
  );
}

export function writeOnboardingSkipped(workspaceId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(onboardingSkipStorageKey(workspaceId), "1");
}
