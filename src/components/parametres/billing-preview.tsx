"use client";

import { useMemo, useState } from "react";
import {
  buildBillingPreview,
  type WorkspaceBilling,
} from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";

export function BillingPreview({
  billing,
}: {
  billing: WorkspaceBilling;
}) {
  const [prixExemple, setPrixExemple] = useState(28000);

  const lines = useMemo(
    () => buildBillingPreview(billing, prixExemple, "2026-09-15"),
    [billing, prixExemple],
  );

  const totalPct =
    billing.facturation_acompte_pct + billing.facturation_solde_pct;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">Aperçu</p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Ex. budget</span>
          <input
            type="number"
            value={prixExemple}
            onChange={(e) => setPrixExemple(Number(e.target.value) || 0)}
            className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm"
            min={0}
            step={500}
          />
          <span>€</span>
        </div>
      </div>

      {totalPct !== 100 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5">
          Les pourcentages totalisent {totalPct}% (idéal : 100%).
        </p>
      )}

      <div className="space-y-2">
        {lines.map((line) => (
          <div
            key={line.label}
            className="flex items-start justify-between gap-4 rounded-md bg-white px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-slate-800">{line.label}</p>
              <p className="text-xs text-slate-400">{line.hint}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-medium text-slate-800">
                {formatCurrency(line.montant)}
              </p>
              {line.date_echeance && (
                <p className="text-xs text-slate-400">{line.date_echeance}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
