"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  Link2,
  Plus,
  Shield,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { CautionStatusBadge } from "@/components/caution/caution-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_CAUTION_REQUESTS,
  type CautionDemoRequest,
} from "@/lib/caution-demo-data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function KpiTile({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  accent: "indigo" | "amber" | "emerald" | "slate";
}) {
  const accents = {
    indigo: "bg-[#4F46E5]/10 text-[#4F46E5]",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accents[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

export function CautionDemoHub({
  workspaceName,
  stripeReady,
  stripeIsDemo,
  defaultAmount,
}: {
  workspaceName: string;
  stripeReady: boolean;
  stripeIsDemo: boolean;
  defaultAmount: number;
}) {
  const [requests, setRequests] =
    useState<CautionDemoRequest[]>(DEMO_CAUTION_REQUESTS);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    DEMO_CAUTION_REQUESTS[0]?.id ?? null,
  );

  const stats = useMemo(() => {
    const active = requests.filter((r) => r.status === "empreinte");
    const pending = requests.filter((r) => r.status === "en_attente");
    const released = requests.filter((r) => r.status === "liberee");
    const blocked = active.reduce((s, r) => s + r.amount, 0);
    return {
      activeCount: active.length,
      blocked,
      pendingCount: pending.length,
      releasedCount: released.length,
    };
  }, [requests]);

  const selected = requests.find((r) => r.id === selectedId) ?? requests[0];

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2800);
  }

  function handleCreate(formData: FormData) {
    const clientName = String(formData.get("clientName") ?? "").trim();
    const clientEmail = String(formData.get("clientEmail") ?? "").trim();
    const eventLabel = String(formData.get("eventLabel") ?? "").trim();
    const eventDate = String(formData.get("eventDate") ?? "");
    const amount = Number(formData.get("amount") ?? 0);

    if (!clientName || amount <= 0) return;

    const newRequest: CautionDemoRequest = {
      id: `c-${Date.now()}`,
      clientName,
      clientEmail,
      eventLabel: eventLabel || "Événement",
      eventDate: eventDate || new Date().toISOString().slice(0, 10),
      amount,
      status: "en_attente",
      createdAt: new Date().toISOString().slice(0, 10),
      linkSentAt: new Date().toISOString().slice(0, 10),
    };

    setRequests((prev) => [newRequest, ...prev]);
    setSelectedId(newRequest.id);
    setOpen(false);
    showFeedback("Demande créée — lien de paiement prêt à envoyer (démo).");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Cautions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {workspaceName} — Empreintes bancaires et dépôts de garantie
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      {!stripeReady ? (
        <Link
          href="/caution/parametres"
          className="flex items-center gap-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-4 shadow-sm transition-colors hover:bg-amber-50 sm:px-6"
        >
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-900">
              Connectez Stripe pour activer les cautions
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Liez le compte bancaire du domaine — nécessaire avant d&apos;envoyer
              un lien de caution à un client.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      ) : stripeIsDemo ? (
        <section className="overflow-hidden rounded-xl border border-[#4F46E5]/20 bg-[#4F46E5]/5 shadow-sm">
          <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Mode démo actif
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Stripe Connect est simulé. Les actions (lien, relance, libération)
                restent en démo jusqu&apos;au branchement Stripe réel.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      <section className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Aperçu rapide</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Empreintes actives"
            value={String(stats.activeCount)}
            detail={`${formatCurrency(stats.blocked)} bloqués`}
            icon={Shield}
            accent="emerald"
          />
          <KpiTile
            label="En attente client"
            value={String(stats.pendingCount)}
            detail="Lien envoyé, paiement non finalisé"
            icon={Clock3}
            accent="amber"
          />
          <KpiTile
            label="Libérées"
            value={String(stats.releasedCount)}
            detail="Cautions restituées"
            icon={CheckCircle2}
            accent="slate"
          />
          <KpiTile
            label="Montant type"
            value="2 500 €"
            detail="Configurable par événement"
            icon={Wallet}
            accent="indigo"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              Demandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {requests.map((request) => (
                <li key={request.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors",
                      selected?.id === request.id
                        ? "bg-[#4F46E5]/5"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {request.clientName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {request.eventLabel} · {formatDate(request.eventDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(request.amount)}
                      </span>
                      <CautionStatusBadge status={request.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    {selected.clientName}
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.eventLabel}
                  </p>
                </div>
                <CautionStatusBadge status={selected.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Montant caution</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                    {formatCurrency(selected.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Date événement</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {formatDate(selected.eventDate)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Email client</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {selected.clientEmail || "—"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Parcours caution
                </p>
                <ol className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4F46E5]/10 text-xs font-medium text-[#4F46E5]">
                      1
                    </span>
                    Lien envoyé au client
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4F46E5]/10 text-xs font-medium text-[#4F46E5]">
                      2
                    </span>
                    Empreinte bancaire validée (Stripe)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      3
                    </span>
                    Libération après l&apos;événement
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    showFeedback("Lien copié (démo — Stripe non connecté).")
                  }
                >
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => showFeedback("Relance envoyée (démo).")}
                >
                  <Link2 className="h-4 w-4" />
                  Relancer
                </Button>
                {selected.status === "empreinte" && (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setRequests((prev) =>
                        prev.map((r) =>
                          r.id === selected.id
                            ? { ...r, status: "liberee" as const }
                            : r,
                        ),
                      );
                      showFeedback("Caution libérée (simulation démo).");
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Libérer la caution
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-[8vh]">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative my-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Nouvelle demande de caution
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Le client recevra un lien sécurisé pour valider son empreinte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  required
                  placeholder="Ex. Sophie & Thomas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email (optionnel)</Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  placeholder="client@email.com"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min={1}
                    step={50}
                    defaultValue={defaultAmount}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date événement</Label>
                  <Input id="eventDate" name="eventDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventLabel">Libellé (optionnel)</Label>
                <Input
                  id="eventLabel"
                  name="eventLabel"
                  placeholder="Mariage, séminaire…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Créer et générer le lien</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
