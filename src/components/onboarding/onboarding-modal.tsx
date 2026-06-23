"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileCheck,
  PartyPopper,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  completeOnboarding,
  saveOnboardingBilling,
  saveOnboardingDomain,
  saveOnboardingGoals,
  saveOnboardingIban,
  saveOnboardingEventType,
} from "@/actions/onboarding";
import { removeCustomEventType } from "@/actions/workspace";
import { BillingPreview } from "@/components/parametres/billing-preview";
import { ContratDomainStatus } from "@/components/parametres/contrat-domain-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingFromWorkspace, type WorkspaceBilling } from "@/lib/billing";
import { BUILTIN_EVENT_TYPES, slugifyEventType } from "@/lib/event-types";
import type { ContratReadiness } from "@/lib/contrat-status";
import type { CustomEventType } from "@/lib/types";
import type { WorkspaceGoals } from "@/lib/workspace-setup";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "goals", label: "Objectifs" },
  { id: "billing", label: "Facturation" },
  { id: "iban", label: "IBAN" },
  { id: "domain", label: "Domaine" },
  { id: "contrat", label: "Contrat" },
  { id: "types", label: "Types" },
  { id: "finish", label: "C'est parti" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function ConfettiBurst() {
  const colors = ["#4F46E5", "#818CF8", "#F59E0B", "#10B981", "#EC4899"];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    delay: `${(i % 7) * 0.08}s`,
    color: colors[i % colors.length],
    rotate: `${(i * 47) % 360}deg`,
  }));

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 h-2.5 w-1.5 animate-onboarding-confetti rounded-sm opacity-90"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

function StepHeader({
  step,
  title,
  description,
}: {
  step: StepId;
  title: string;
  description: string;
}) {
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="border-b border-slate-100 px-6 py-5 pr-12">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Étape {stepIndex + 1} sur {STEPS.length}
      </p>
      {step === "domain" && (
        <div className="mb-2 flex items-center gap-2 text-[#4F46E5]">
          <Sparkles className="h-5 w-5" />
          <p className="text-sm font-medium">Bienvenue sur Venqor</p>
        </div>
      )}
      {step === "finish" && (
        <div className="mb-2 flex items-center gap-2 text-[#4F46E5]">
          <PartyPopper className="h-5 w-5" />
          <p className="text-sm font-medium">Votre espace est prêt</p>
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SkipStepButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full text-slate-500"
      onClick={onClick}
      disabled={disabled}
    >
      Passer cette étape
    </Button>
  );
}

export function OnboardingModal({
  initialDomainName,
  initialGoals,
  initialBilling,
  customEventTypes: initialCustomTypes,
  contratStatus,
}: {
  initialDomainName: string;
  initialGoals: WorkspaceGoals;
  initialBilling: WorkspaceBilling;
  customEventTypes: CustomEventType[];
  contratStatus: ContratReadiness;
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("goals");
  const [domainName, setDomainName] = useState(initialDomainName);
  const [dossiers, setDossiers] = useState(
    initialGoals.objectif_dossiers_annuel?.toString() ?? "",
  );
  const [ca, setCa] = useState(
    initialGoals.objectif_ca_annuel
      ? String(Math.round(initialGoals.objectif_ca_annuel))
      : "",
  );
  const [billing, setBilling] = useState(billingFromWorkspace(initialBilling));
  const [iban, setIban] = useState("");
  const [titulaire, setTitulaire] = useState("");
  const [customTypes, setCustomTypes] = useState(initialCustomTypes);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const totalPct =
    billing.facturation_acompte_pct + billing.facturation_solde_pct;

  function goToNextStep() {
    setError(null);
    const next = STEPS[stepIndex + 1]?.id;
    if (next) setStep(next);
  }

  async function handleClose() {
    if (pending) return;
    setPending(true);
    await completeOnboarding();
    setPending(false);
    router.refresh();
  }

  async function handleFinish() {
    if (pending) return;
    setPending(true);
    await completeOnboarding();
    setPending(false);
    router.push("/?nouveau=1");
    router.refresh();
  }

  function updateBillingField<K extends keyof WorkspaceBilling>(
    key: K,
    value: WorkspaceBilling[K],
  ) {
    setBilling((prev) => ({ ...prev, [key]: value }));
  }

  async function submitGoals(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!dossiers.trim() && !ca.trim()) {
      goToNextStep();
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("objectif_dossiers_annuel", dossiers);
    formData.set("objectif_ca_annuel", ca);
    const result = await saveOnboardingGoals(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    goToNextStep();
    router.refresh();
  }

  async function submitBilling(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    Object.entries(billing).forEach(([key, value]) => {
      formData.set(key, String(value));
    });
    const result = await saveOnboardingBilling(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    goToNextStep();
    router.refresh();
  }

  async function submitIban(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("iban", iban);
    formData.set("titulaire_compte", titulaire);
    const result = await saveOnboardingIban(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    goToNextStep();
    router.refresh();
  }

  async function submitDomain(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("nom_domaine", domainName);
    const result = await saveOnboardingDomain(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    goToNextStep();
    router.refresh();
  }

  async function submitEventType(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !newTypeLabel.trim()) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("label", newTypeLabel.trim());
    const result = await saveOnboardingEventType(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const label = newTypeLabel.trim();
    setNewTypeLabel("");
    setCustomTypes((prev) => [
      ...prev,
      { slug: slugifyEventType(label), label },
    ]);
    router.refresh();
  }

  async function handleRemoveType(slug: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("slug", slug);
    const result = await removeCustomEventType(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCustomTypes((prev) => prev.filter((t) => t.slug !== slug));
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {step === "finish" && <ConfettiBurst />}

        <button
          type="button"
          onClick={() => void handleClose()}
          className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fermer la configuration"
          disabled={pending}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="shrink-0 border-b border-slate-100 px-6 py-4 pr-12">
          <div className="flex items-center gap-1.5">
            {STEPS.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  index <= stepIndex ? "bg-[#4F46E5]" : "bg-slate-100",
                )}
                title={item.label}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {step === "goals" && (
            <>
              <StepHeader
                step="goals"
                title="Quels sont vos objectifs ?"
                description="Fixez vos cibles annuelles pour suivre votre saison dans le Pilotage."
              />
              <form onSubmit={submitGoals} className="space-y-4 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-dossiers">
                      Objectif dossiers / an
                    </Label>
                    <Input
                      id="onboarding-dossiers"
                      type="number"
                      min={1}
                      placeholder="Ex. 25"
                      value={dossiers}
                      onChange={(e) => setDossiers(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-ca">Objectif CA / an (€)</Label>
                    <Input
                      id="onboarding-ca"
                      type="number"
                      min={1}
                      placeholder="Ex. 400000"
                      value={ca}
                      onChange={(e) => setCa(e.target.value)}
                    />
                  </div>
                </div>
                {error && <ErrorBox message={error} />}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Enregistrement…" : "Continuer"}
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </form>
            </>
          )}

          {step === "billing" && (
            <>
              <StepHeader
                step="billing"
                title="Comment facturez-vous ?"
                description="Définissez acompte et solde — l'échéancier sera généré automatiquement sur vos dossiers une fois enregistré."
              />
              <form onSubmit={submitBilling} className="space-y-4 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-md border border-slate-100 p-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Acompte
                    </p>
                    <div className="space-y-2">
                      <Label>Libellé</Label>
                      <Input
                        value={billing.facturation_acompte_label}
                        onChange={(e) =>
                          updateBillingField(
                            "facturation_acompte_label",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>%</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={billing.facturation_acompte_pct}
                        onChange={(e) => {
                          const pct = Number(e.target.value) || 0;
                          updateBillingField("facturation_acompte_pct", pct);
                          updateBillingField(
                            "facturation_solde_pct",
                            Math.max(0, 100 - pct),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jours après génération</Label>
                      <Input
                        type="number"
                        min={0}
                        value={billing.facturation_acompte_jours}
                        onChange={(e) =>
                          updateBillingField(
                            "facturation_acompte_jours",
                            Number(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3 rounded-md border border-slate-100 p-3">
                    <p className="text-sm font-semibold text-slate-800">Solde</p>
                    <div className="space-y-2">
                      <Label>Libellé</Label>
                      <Input
                        value={billing.facturation_solde_label}
                        onChange={(e) =>
                          updateBillingField(
                            "facturation_solde_label",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>%</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={billing.facturation_solde_pct}
                        onChange={(e) => {
                          const pct = Number(e.target.value) || 0;
                          updateBillingField("facturation_solde_pct", pct);
                          updateBillingField(
                            "facturation_acompte_pct",
                            Math.max(0, 100 - pct),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jours vs date événement</Label>
                      <Input
                        type="number"
                        value={billing.facturation_solde_jours}
                        onChange={(e) =>
                          updateBillingField(
                            "facturation_solde_jours",
                            Number(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
                {totalPct !== 100 && (
                  <p className="text-sm text-amber-700">
                    Total : {totalPct}% — ajustez pour atteindre 100 %.
                  </p>
                )}
                <BillingPreview billing={billing} />
                {error && <ErrorBox message={error} />}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending || totalPct !== 100}
                >
                  {pending ? "Enregistrement…" : "Enregistrer et continuer"}
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </form>
            </>
          )}

          {step === "iban" && (
            <>
              <StepHeader
                step="iban"
                title="Sur quel IBAN recevoir les acomptes ?"
                description="Les mariés verront ces coordonnées sur leur espace de paiement."
              />
              <form onSubmit={submitIban} className="space-y-4 px-6 py-5">
                <div className="space-y-2">
                  <Label htmlFor="onboarding-iban">IBAN</Label>
                  <Input
                    id="onboarding-iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboarding-titulaire">
                    Titulaire du compte (optionnel)
                  </Label>
                  <Input
                    id="onboarding-titulaire"
                    value={titulaire}
                    onChange={(e) => setTitulaire(e.target.value)}
                    placeholder={domainName || "Nom du domaine"}
                  />
                </div>
                {error && <ErrorBox message={error} />}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Enregistrement…" : "Continuer"}
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </form>
            </>
          )}

          {step === "domain" && (
            <>
              <StepHeader
                step="domain"
                title="Quel est le nom de votre domaine ?"
                description="Ce nom apparaîtra sur vos portails mariés et vos emails."
              />
              <form onSubmit={submitDomain} className="space-y-4 px-6 py-5">
                <div className="space-y-2">
                  <Label htmlFor="onboarding-domain">Nom du domaine / lieu</Label>
                  <Input
                    id="onboarding-domain"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    required
                    placeholder="Château des Lauriers"
                    autoFocus
                  />
                </div>
                {error && <ErrorBox message={error} />}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Enregistrement…" : "Continuer"}
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </form>
            </>
          )}

          {step === "contrat" && (
            <>
              <StepHeader
                step="contrat"
                title="Contrat de réservation"
                description="Votre contrat type est préparé avec l'équipe Venqor. Depuis un dossier en date bloquée, utilisez « Envoyer le contrat »."
              />
              <div className="space-y-4 px-6 py-5">
                <ContratDomainStatus status={contratStatus} />
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p>
                      Les deux mariés signent en ligne via Yousign. Vous serez
                      notifié une fois le contrat signé.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={goToNextStep}
                  disabled={pending}
                >
                  Continuer
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </div>
            </>
          )}

          {step === "types" && (
            <>
              <StepHeader
                step="types"
                title="Types d'événements"
                description="Mariage et Autre sont inclus. Ajoutez vos propres types pour les autres activités du domaine."
              />
              <div className="space-y-4 px-6 py-5">
                <ul className="space-y-2">
                  {Object.entries(BUILTIN_EVENT_TYPES).map(([slug, label]) => (
                    <li
                      key={slug}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      <span>{label}</span>
                      <span className="text-xs text-slate-400">Par défaut</span>
                    </li>
                  ))}
                  {customTypes.map((type) => (
                    <li
                      key={type.slug}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-slate-800">{type.label}</span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveType(type.slug)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        aria-label={`Supprimer ${type.label}`}
                        disabled={pending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={submitEventType} className="flex gap-2">
                  <Input
                    value={newTypeLabel}
                    onChange={(e) => setNewTypeLabel(e.target.value)}
                    placeholder="Ex. Séminaire, Baptême…"
                    disabled={pending}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="shrink-0 gap-1"
                    disabled={pending || !newTypeLabel.trim()}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </form>
                {error && <ErrorBox message={error} />}
                <Button
                  type="button"
                  className="w-full"
                  onClick={goToNextStep}
                  disabled={pending}
                >
                  Continuer
                </Button>
                <SkipStepButton onClick={goToNextStep} disabled={pending} />
              </div>
            </>
          )}

          {step === "finish" && (
            <>
              <StepHeader
                step="finish"
                title={
                  domainName
                    ? `${domainName} est configuré !`
                    : "Votre espace est prêt !"
                }
                description="Il ne reste plus qu'à créer votre premier dossier."
              />
              <div className="px-6 py-5">
                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full gap-2 text-base font-semibold shadow-lg shadow-[#4F46E5]/25"
                  onClick={() => void handleFinish()}
                  disabled={pending}
                >
                  <PartyPopper className="h-5 w-5" />
                  C&apos;est parti ! Créez votre premier événement
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}
