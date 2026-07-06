"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Unplug,
} from "lucide-react";
import {
  disconnectStripeConnectDemo,
  startStripeConnectOnboarding,
  updateCautionDefaults,
} from "@/actions/caution-stripe";
import { SettingsInfoBox, SettingsSection } from "@/components/parametres/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  formatStripeAccountLabel,
  isStripePlatformConfigured,
  type StripeConnectStatus,
} from "@/lib/stripe-connect-status";
import { cn, formatCurrency } from "@/lib/utils";

export function CautionStripeSettings({
  connectStatus,
  defaultAmount,
  stripeReturn,
}: {
  connectStatus: StripeConnectStatus;
  defaultAmount: number | null;
  stripeReturn?: boolean;
}) {
  const [amount, setAmount] = useState(
    defaultAmount ? String(Math.round(defaultAmount)) : "2500",
  );
  const [message, setMessage] = useState<string | null>(
    stripeReturn
      ? "Retour Stripe — vérifiez que les paiements sont activés sur votre compte."
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  const platformReady = isStripePlatformConfigured();

  function handleConnect() {
    setError(null);
    setMessage(null);
    void run(async () => {
      const result = await startStripeConnectOnboarding();
      if (result.error) setError(result.error);
      else if (!platformReady) {
        setMessage("Connexion simulée — prêt pour les demandes de caution (démo).");
      }
    });
  }

  function handleDisconnect() {
    setError(null);
    void run(async () => {
      const result = await disconnectStripeConnectDemo();
      if (result.error) setError(result.error);
      else setMessage("Compte déconnecté.");
    });
  }

  function handleSaveDefault(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateCautionDefaults(formData);
      if (result.error) setError(result.error);
      else setMessage("Montant par défaut enregistré.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Paramètres Stripe
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Connectez le compte bancaire du domaine pour encaisser et libérer les
          cautions via Stripe Connect.
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
        title="Compte Stripe Connect"
        description="Chaque domaine possède son propre compte connecté. Les fonds sont versés sur le compte bancaire du domaine, Venqor prélève éventuellement une commission plateforme."
      >
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-4",
              connectStatus.ready
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-amber-200 bg-amber-50/80",
            )}
          >
            {connectStatus.ready ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">
                {connectStatus.ready
                  ? "Stripe Connect actif"
                  : "Stripe Connect non configuré"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {connectStatus.ready
                  ? connectStatus.isDemo
                    ? "Mode simulation — les demandes de caution fonctionnent en démo sans vrai paiement."
                    : "Paiements et libérations de caution disponibles."
                  : "Connectez Stripe pour envoyer des liens de caution à vos clients."}
              </p>
              {connectStatus.accountId && (
                <p className="mt-2 font-mono text-xs text-slate-500">
                  {formatStripeAccountLabel(connectStatus.accountId)}
                </p>
              )}
            </div>
          </div>

          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <StatusRow
              label="Encaissements (charges)"
              ok={connectStatus.chargesEnabled}
            />
            <StatusRow
              label="Virements (payouts)"
              ok={connectStatus.payoutsEnabled}
            />
          </ul>

          <div className="flex flex-wrap gap-2 pt-1">
            {!connectStatus.ready && (
              <Button
                type="button"
                className="gap-2"
                disabled={pending}
                onClick={handleConnect}
              >
                <Link2 className="h-4 w-4" />
                {platformReady
                  ? "Connecter avec Stripe"
                  : "Simuler la connexion (démo)"}
              </Button>
            )}
            {connectStatus.ready && connectStatus.isDemo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={pending}
                onClick={handleDisconnect}
              >
                <Unplug className="h-4 w-4" />
                Réinitialiser (démo)
              </Button>
            )}
            {connectStatus.ready && !connectStatus.isDemo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={pending}
                onClick={handleConnect}
              >
                <ExternalLink className="h-4 w-4" />
                Compléter l&apos;onboarding Stripe
              </Button>
            )}
          </div>

          {!platformReady && (
            <SettingsInfoBox title="Mode démo">
              <p>
                Tant que{" "}
                <code className="rounded bg-slate-200 px-1 text-xs">
                  STRIPE_SECRET_KEY
                </code>{" "}
                n&apos;est pas défini sur Venqor, le bouton simule une connexion
                réussie pour vos démos commerciales.
              </p>
            </SettingsInfoBox>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Montant de caution par défaut"
        description="Pré-rempli lors de la création d'une nouvelle demande."
      >
        <form action={handleSaveDefault} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="caution_montant_defaut">Montant (€)</Label>
            <Input
              id="caution_montant_defaut"
              name="caution_montant_defaut"
              type="number"
              min={1}
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
      </SettingsSection>

      <SettingsSection
        title="Comment ça marche"
        description="Résumé du flux une fois Stripe branché en production."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Le domaine connecte son compte Stripe (KYC, IBAN — géré par Stripe).
          </li>
          <li>
            Vous créez une demande de caution → Venqor génère un lien Checkout /
            PaymentIntent en capture manuelle.
          </li>
          <li>Le client valide son empreinte bancaire.</li>
          <li>
            Après l&apos;événement, vous libérez la caution depuis Venqor (annulation
            de l&apos;autorisation ou remboursement).
          </li>
        </ol>
      </SettingsSection>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-2",
        ok ? "border-emerald-100 bg-emerald-50/50" : "border-slate-200 bg-white",
      )}
    >
      <span className="text-slate-600">{label}</span>
      <span
        className={cn(
          "text-xs font-medium",
          ok ? "text-emerald-700" : "text-slate-400",
        )}
      >
        {ok ? "Actif" : "Inactif"}
      </span>
    </li>
  );
}
