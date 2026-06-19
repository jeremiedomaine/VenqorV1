"use client";

import { useMemo, useState } from "react";
import { updateWorkspaceBilling } from "@/actions/workspace";
import { BillingPreview } from "@/components/parametres/billing-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingFromWorkspace, type WorkspaceBilling } from "@/lib/billing";

export function BillingSettingsForm({
  workspace,
}: {
  workspace: WorkspaceBilling & { id: string };
}) {
  const initial = billingFromWorkspace(workspace);
  const [billing, setBilling] = useState(initial);

  const totalPct = billing.facturation_acompte_pct + billing.facturation_solde_pct;

  function updateField<K extends keyof WorkspaceBilling>(
    key: K,
    value: WorkspaceBilling[K],
  ) {
    setBilling((prev) => ({ ...prev, [key]: value }));
  }

  const hiddenFields = useMemo(
    () =>
      Object.entries(billing).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      )),
    [billing],
  );

  return (
    <form action={updateWorkspaceBilling} className="space-y-6">
      {hiddenFields}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-md border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Acompte</h3>
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input
              value={billing.facturation_acompte_label}
              onChange={(e) =>
                updateField("facturation_acompte_label", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Pourcentage (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={billing.facturation_acompte_pct}
              onChange={(e) => {
                const pct = Number(e.target.value) || 0;
                updateField("facturation_acompte_pct", pct);
                updateField("facturation_solde_pct", Math.max(0, 100 - pct));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Échéance (jours après génération)</Label>
            <Input
              type="number"
              min={0}
              value={billing.facturation_acompte_jours}
              onChange={(e) =>
                updateField(
                  "facturation_acompte_jours",
                  Number(e.target.value) || 0,
                )
              }
            />
            <p className="text-xs text-slate-500">0 = à la signature du contrat</p>
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Solde</h3>
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input
              value={billing.facturation_solde_label}
              onChange={(e) =>
                updateField("facturation_solde_label", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Pourcentage (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={billing.facturation_solde_pct}
              onChange={(e) => {
                const pct = Number(e.target.value) || 0;
                updateField("facturation_solde_pct", pct);
                updateField("facturation_acompte_pct", Math.max(0, 100 - pct));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Échéance (jours vs date du mariage)</Label>
            <Input
              type="number"
              value={billing.facturation_solde_jours}
              onChange={(e) =>
                updateField(
                  "facturation_solde_jours",
                  Number(e.target.value) || 0,
                )
              }
            />
            <p className="text-xs text-slate-500">
              Ex. -30 = 30 jours avant le mariage
            </p>
          </div>
        </div>
      </div>

      {totalPct !== 100 && (
        <p className="text-sm text-amber-700">
          Total : {totalPct}% — ajustez pour atteindre 100%.
        </p>
      )}

      <BillingPreview billing={billing} />

      <Button type="submit">Enregistrer la facturation</Button>
    </form>
  );
}
