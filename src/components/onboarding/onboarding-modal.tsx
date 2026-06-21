"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PartyPopper, Sparkles } from "lucide-react";
import { saveOnboardingDomain, saveOnboardingIban } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

const STEPS = [
  { id: 1, label: "Domaine" },
  { id: 2, label: "IBAN" },
  { id: 3, label: "C'est parti" },
] as const;

export function OnboardingModal({
  initialDomainName,
}: {
  initialDomainName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [open, setOpen] = useState(true);
  const [domainName, setDomainName] = useState(initialDomainName);
  const [iban, setIban] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleDomainSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    setStep(2);
    router.refresh();
  }

  async function handleIbanSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("iban", iban);
    formData.set("titulaire_compte", domainName);
    const result = await saveOnboardingIban(formData);

    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(3);
    router.refresh();
  }

  function handleFinish() {
    setOpen(false);
    router.push("/?nouveau=1");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {step === 3 && <ConfettiBurst />}

        <div className="relative border-b border-slate-100 px-6 py-5">
          <div className="mb-4 flex items-center gap-2">
            {STEPS.map((item, index) => (
              <div key={item.id} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    step >= item.id
                      ? "bg-[#4F46E5] text-white"
                      : "bg-slate-100 text-slate-400",
                  )}
                >
                  {item.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      step > item.id ? "bg-[#4F46E5]" : "bg-slate-100",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="flex items-center gap-2 text-[#4F46E5]">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-medium">Bienvenue sur Venqor</p>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Quel est le nom de votre domaine ?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ce nom apparaîtra sur vos portails mariés et vos emails.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-slate-900">
                Sur quel IBAN recevoir les acomptes ?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Les mariés verront ces coordonnées sur leur espace de paiement.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2 text-[#4F46E5]">
                <PartyPopper className="h-5 w-5" />
                <p className="text-sm font-medium">Votre espace est prêt</p>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {domainName} est configuré !
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Il ne reste plus qu&apos;à créer votre premier dossier.
              </p>
            </>
          )}
        </div>

        <div className="relative px-6 py-5">
          {step === 1 && (
            <form onSubmit={handleDomainSubmit} className="space-y-4">
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
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Enregistrement…" : "Continuer"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleIbanSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onboarding-iban">IBAN</Label>
                <Input
                  id="onboarding-iban"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  required
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  autoFocus
                />
              </div>
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Enregistrement…" : "Continuer"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <Button
              type="button"
              size="lg"
              className="h-14 w-full gap-2 text-base font-semibold shadow-lg shadow-[#4F46E5]/25"
              onClick={handleFinish}
            >
              <PartyPopper className="h-5 w-5" />
              C&apos;est parti ! Créez votre premier événement
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
