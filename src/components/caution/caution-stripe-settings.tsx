"use client";

import { useState } from "react";
import { CheckCircle2, Link2, Sparkles } from "lucide-react";
import { updateCautionDefaults } from "@/actions/caution-stripe";
import {
  SettingsInfoBox,
  SettingsSection,
} from "@/components/parametres/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatCurrency } from "@/lib/utils";

export function CautionStripeSettings({
  defaultAmount,
}: {
  connectStatus?: unknown;
  defaultAmount: number | null;
  stripeReturn?: boolean;
}) {
  const [amount, setAmount] = useState(
    defaultAmount ? String(Math.round(defaultAmount)) : "500",
  );
  const [autoJ7, setAutoJ7] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  function handleSaveDefault(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateCautionDefaults(formData);
      if (result.error) setError(result.error);
      else setMessage("Montant Swikly par défaut enregistré.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Caution Swikly (empreinte bancaire) et automatisation J-7 — adaptés à
          votre saison.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <SettingsSection
        title="Swikly — empreinte de caution"
        description="Remplace les chèques papier et le malaise du TPE le vendredi. Le montant est bloqué, pas encaissé."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium text-slate-900">
                Intégration Swikly (démo R2)
              </p>
              <p className="mt-1 text-sm text-slate-600">
                En production : chaque séjour reçoit un lien Swikly unique. Le
                couple valide son empreinte depuis chez lui, avant l&apos;arrivée.
              </p>
            </div>
          </div>

          <SettingsInfoBox title="Pourquoi Swikly ?">
            <p>
              Empreinte bancaire vérifiée (pas de chèque en bois), sans débit
              immédiat, sans présenter un terminal le jour J. Montants typiques
              chez vous : 500 € à 800 € selon le week-end.
            </p>
          </SettingsInfoBox>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Montant par défaut"
        description="Pré-rempli à la création d'un séjour. Ajustable dossier par dossier."
      >
        <form
          action={handleSaveDefault}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="caution_montant_defaut">Montant (€)</Label>
            <Input
              id="caution_montant_defaut"
              name="caution_montant_defaut"
              type="number"
              min={100}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-40"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Enregistrer
          </Button>
          {defaultAmount != null && (
            <p className="text-sm text-slate-500">
              Actuel : {formatCurrency(defaultAmount)}
            </p>
          )}
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {[500, 800].map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={amount === String(v) ? "default" : "outline"}
              onClick={() => setAmount(String(v))}
            >
              {formatCurrency(v)}
            </Button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Envoi automatique J-7"
        description="Un lien part une semaine avant l'arrivée — plus besoin d'y penser le vendredi."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
            checked={autoJ7}
            onChange={(e) => {
              setAutoJ7(e.target.checked);
              setMessage(
                e.target.checked
                  ? "Envoi auto J-7 activé (démo)."
                  : "Envoi auto désactivé — envoi manuel uniquement.",
              );
            }}
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Link2 className="h-4 w-4 text-[#4F46E5]" />
              Envoyer le lien Swikly à J-7
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Relance automatique si non validé à J-3 (à brancher avec Swikly).
            </span>
          </span>
        </label>
      </SettingsSection>

      <SettingsSection title="Gel hivernal (rappel commercial)">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#4F46E5]" />
          <p>
            Abonnement facturé uniquement pendant la saison active (≈ 6 mois).
            Hiver gelé à 0 € — aligné sur votre activité saisonnière.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
