import type { Workspace } from "@/lib/types";

export type ProductMode = "full" | "caution_only";

export type WorkspaceCapabilities = {
  productMode: ProductMode;
  dashboard: boolean;
  pilotage: boolean;
  automatisations: boolean;
  caution: boolean;
  homeRoute: "/" | "/caution";
};

export function getProductMode(
  workspace: Pick<Workspace, "product_mode"> | null | undefined,
): ProductMode {
  return workspace?.product_mode === "caution_only" ? "caution_only" : "full";
}

export function getWorkspaceCapabilities(
  workspace: Pick<Workspace, "product_mode"> | null | undefined,
): WorkspaceCapabilities {
  const productMode = getProductMode(workspace);

  if (productMode === "caution_only") {
    return {
      productMode,
      dashboard: false,
      pilotage: false,
      automatisations: false,
      caution: true,
      homeRoute: "/caution",
    };
  }

  return {
    productMode,
    dashboard: true,
    pilotage: true,
    automatisations: true,
    caution: false,
    homeRoute: "/",
  };
}
