"use client";

import { useState } from "react";
import { updateWorkspaceEncaissements } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import { NEUTRAL_COPY } from "@/lib/event-copy";
import type { WorkspaceEncaissements } from "@/lib/payment-utils";

export function EncaissementsSettingsForm({
  encaissements,
}: {
  encaissements: WorkspaceEncaissements;
}) {
  const [iban, setIban] = useState(encaissements.iban ?? "");
  const [bic, setBic] = useState(encaissements.bic ?? "");
  const [titulaire, setTitulaire] = useState(
    encaissements.titulaire_compte ?? "",
  );
  const [instructions, setInstructions] = useState(
    encaissements.instructions_virement ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  function handleSubmit(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateWorkspaceEncaissements(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="mode_paiement_defaut" value="virement" />
      <input type="hidden" name="iban" value={iban} />
      <input type="hidden" name="bic" value={bic} />
      <input type="hidden" name="titulaire_compte" value={titulaire} />
      <input
        type="hidden"
        name="instructions_virement"
        value={instructions}
      />

      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <p className="text-sm font-medium text-slate-900">Virement bancaire</p>
        <p className="mt-1 text-xs text-slate-500">
          {NEUTRAL_COPY.settingsPortalDeclare}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Coordonnées bancaires
        </h3>
        <p className="text-xs text-slate-500">
          Affichées sur la {NEUTRAL_COPY.portalPage.toLowerCase()} pour les virements.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="titulaire_compte">Titulaire du compte</Label>
            <Input
              id="titulaire_compte"
              value={titulaire}
              onChange={(e) => setTitulaire(e.target.value)}
              placeholder="Domaine Les Chênes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bic">BIC (optionnel)</Label>
            <Input
              id="bic"
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              placeholder="BNPAFRPP"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instructions_virement">
              Instructions complémentaires
            </Label>
            <textarea
              id="instructions_virement"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
              placeholder="Indiquez la référence à mentionner, délais de traitement, etc."
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les encaissements"}
      </Button>
    </form>
  );
}
