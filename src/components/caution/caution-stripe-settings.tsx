"use client";

import { useState } from "react";
import { CheckCircle2, Link2, Mail } from "lucide-react";
import {
  updateCautionAutoSettings,
  updateCautionDefaults,
} from "@/actions/caution-stripe";
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
  autoActive = true,
  autoJoursAvant = 7,
  relanceActive = true,
  relanceJoursAvant = 3,
}: {
  connectStatus?: unknown;
  defaultAmount: number | null;
  stripeReturn?: boolean;
  autoActive?: boolean;
  autoJoursAvant?: number;
  relanceActive?: boolean;
  relanceJoursAvant?: number;
}) {
  const [amount, setAmount] = useState(
    defaultAmount ? String(Math.round(defaultAmount)) : "500",
  );
  const [autoOn, setAutoOn] = useState(autoActive);
  const [autoDays, setAutoDays] = useState(String(autoJoursAvant));
  const [relanceOn, setRelanceOn] = useState(relanceActive);
  const [relanceDays, setRelanceDays] = useState(String(relanceJoursAvant));
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

  function handleSaveAuto(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateCautionAutoSettings(formData);
      if (result.error) setError(result.error);
      else {
        setMessage(
          autoOn
            ? `Automatisation enregistrée — envoi à J-${autoDays}.`
            : "Automatisation désactivée — envoi manuel uniquement.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Caution Swikly, montant par défaut et envoi automatique des demandes.
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
                Intégration Swikly
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Chaque séjour reçoit un lien Swikly unique. Le couple valide son
                empreinte depuis chez lui, avant l&apos;arrivée.
              </p>
            </div>
          </div>

          <SettingsInfoBox title="Pourquoi Swikly ?">
            <p>
              Empreinte bancaire vérifiée (pas de chèque en bois), sans débit
              immédiat, sans présenter un terminal le jour J. Montants typiques
              : 500 € à 800 € selon le week-end.
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
        title="Demande automatique de caution"
        description="Définissez quand le lien Swikly et l'email partent avant l'arrivée du couple."
      >
        <form action={handleSaveAuto} className="space-y-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              name="caution_auto_active"
              value="on"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
              checked={autoOn}
              onChange={(e) => setAutoOn(e.target.checked)}
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Link2 className="h-4 w-4 text-[#4F46E5]" />
                Envoyer automatiquement le lien Swikly + email
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Crée la demande Swikly et envoie l&apos;email au couple à la date
                choisie. Sinon, envoi manuel depuis chaque séjour.
              </span>
            </span>
          </label>

          <div
            className={`space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4 ${
              autoOn ? "" : "opacity-50"
            }`}
          >
            <div className="space-y-2">
              <Label htmlFor="caution_auto_jours_avant">
                Envoi à J−… (jours avant l&apos;arrivée)
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="caution_auto_jours_avant"
                  name="caution_auto_jours_avant"
                  type="number"
                  min={1}
                  max={90}
                  value={autoDays}
                  onChange={(e) => setAutoDays(e.target.value)}
                  disabled={!autoOn}
                  className="w-24 bg-white"
                />
                <span className="text-sm text-slate-600">
                  = J−{autoDays || "…"} (
                  {autoDays === "7"
                    ? "1 semaine avant"
                    : autoDays === "14"
                      ? "2 semaines avant"
                      : `${autoDays || "…"} jours avant`}
                  )
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[3, 5, 7, 10, 14].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={autoDays === String(d) ? "default" : "outline"}
                    disabled={!autoOn}
                    onClick={() => setAutoDays(String(d))}
                  >
                    J−{d}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                name="caution_relance_active"
                value="on"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
                checked={relanceOn}
                disabled={!autoOn}
                onChange={(e) => setRelanceOn(e.target.checked)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Mail className="h-4 w-4 text-[#4F46E5]" />
                  Relancer si non validé
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Deuxième email si l&apos;empreinte n&apos;est pas encore
                  acceptée.
                </span>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Label
                    htmlFor="caution_relance_jours_avant"
                    className="text-xs text-slate-500"
                  >
                    Relance à J−
                  </Label>
                  <Input
                    id="caution_relance_jours_avant"
                    name="caution_relance_jours_avant"
                    type="number"
                    min={0}
                    max={60}
                    value={relanceDays}
                    onChange={(e) => setRelanceDays(e.target.value)}
                    disabled={!autoOn || !relanceOn}
                    className="w-20"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 5].map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={
                          relanceDays === String(d) ? "default" : "outline"
                        }
                        disabled={!autoOn || !relanceOn}
                        onClick={() => setRelanceDays(String(d))}
                      >
                        J−{d}
                      </Button>
                    ))}
                  </div>
                </div>
              </span>
            </label>
          </div>

          <Button type="submit" disabled={pending}>
            Enregistrer l&apos;automatisation
          </Button>
        </form>
      </SettingsSection>
    </div>
  );
}
