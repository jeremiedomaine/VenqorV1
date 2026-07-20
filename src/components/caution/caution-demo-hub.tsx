"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Film,
  Link2,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import {
  EdlStatusBadge,
  SwiklyStatusBadge,
} from "@/components/caution/caution-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEMO_SEJOURS,
  type CautionSejour,
  type EdlStatus,
} from "@/lib/caution-demo-data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function CautionDemoHub({
  workspaceName,
  defaultAmount,
}: {
  workspaceName: string;
  defaultAmount: number;
  /** conservés pour compat page serveur */
  stripeReady?: boolean;
  stripeIsDemo?: boolean;
}) {
  const [sejours, setSejours] = useState<CautionSejour[]>(DEMO_SEJOURS);
  const [selectedId, setSelectedId] = useState(DEMO_SEJOURS[0]?.id ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"entree" | "sortie" | null>(null);
  const entreeInputRef = useRef<HTMLInputElement>(null);
  const sortieInputRef = useRef<HTMLInputElement>(null);

  const selected = sejours.find((s) => s.id === selectedId) ?? sejours[0];

  const stats = useMemo(() => {
    const aEnvoyer = sejours.filter((s) => s.swiklyStatus === "a_envoyer").length;
    const empreintes = sejours.filter((s) => s.swiklyStatus === "empreinte").length;
    const edlManquants = sejours.filter(
      (s) => s.edlEntree === "manquant" || s.edlSortie === "manquant",
    ).length;
    const extras = sejours.reduce(
      (n, s) => n + s.extras.filter((e) => e.status === "nouvelle").length,
      0,
    );
    return { aEnvoyer, empreintes, edlManquants, extras };
  }, [sejours]);

  function toast(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3200);
  }

  function sendSwikly(sejourId: string) {
    setSejours((prev) =>
      prev.map((s) =>
        s.id === sejourId
          ? {
              ...s,
              swiklyStatus: "envoye" as const,
              swiklySentAt: new Date().toISOString().slice(0, 10),
            }
          : s,
      ),
    );
    const s = sejours.find((x) => x.id === sejourId);
    toast(
      `Lien Swikly ${formatCurrency(s?.cautionAmount ?? defaultAmount)} envoyé à ${s?.email ?? "le couple"} (simulation).`,
    );
  }

  function simulateEmpreinte(sejourId: string) {
    setSejours((prev) =>
      prev.map((s) =>
        s.id === sejourId ? { ...s, swiklyStatus: "empreinte" as const } : s,
      ),
    );
    toast("Empreinte bancaire validée — aucun débit (Swikly).");
  }

  function liberer(sejourId: string) {
    setSejours((prev) =>
      prev.map((s) =>
        s.id === sejourId ? { ...s, swiklyStatus: "liberee" as const } : s,
      ),
    );
    toast("Caution libérée — empreinte levée.");
  }

  function handleVideo(
    sejourId: string,
    kind: "entree" | "sortie",
    file: File | null,
  ) {
    if (!file) return;
    if (!file.type.startsWith("video/") && !file.name.toLowerCase().endsWith(".mp4")) {
      toast("Format attendu : vidéo .mp4 (comme depuis votre smartphone).");
      return;
    }
    setUploading(kind);
    window.setTimeout(() => {
      const fileName = file.name || `edl-${kind}-${Date.now()}.mp4`;
      setSejours((prev) =>
        prev.map((s) => {
          if (s.id !== sejourId) return s;
          if (kind === "entree") {
            return {
              ...s,
              edlEntree: "enregistree" as EdlStatus,
              edlEntreeFile: fileName,
            };
          }
          return {
            ...s,
            edlSortie: "enregistree" as EdlStatus,
            edlSortieFile: fileName,
          };
        }),
      );
      setUploading(null);
      toast(
        `Vidéo ${kind === "entree" ? "d'entrée" : "de sortie"} enregistrée — prête à envoyer aux mariés.`,
      );
    }, 900);
  }

  function sendEdlToCouple(sejourId: string, kind: "entree" | "sortie") {
    setSejours((prev) =>
      prev.map((s) => {
        if (s.id !== sejourId) return s;
        if (kind === "entree") {
          return { ...s, edlEntree: "envoyee" as EdlStatus };
        }
        return { ...s, edlSortie: "envoyee" as EdlStatus };
      }),
    );
    toast(
      `État des lieux ${kind === "entree" ? "d'entrée" : "de sortie"} envoyé aux mariés (preuve).`,
    );
  }

  function markExtraFacturee(sejourId: string, extraId: string) {
    setSejours((prev) =>
      prev.map((s) =>
        s.id === sejourId
          ? {
              ...s,
              extras: s.extras.map((e) =>
                e.id === extraId ? { ...e, status: "facturee" as const } : e,
              ),
            }
          : s,
      ),
    );
    toast("Demande marquée comme facturée.");
  }

  if (!selected) {
    return (
      <p className="text-sm text-slate-500">Aucun séjour pour le moment.</p>
    );
  }

  const jRelatif = daysUntil(selected.dateArrivee);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Séjours
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {workspaceName} — Caution Swikly à J-7 & états des lieux vidéo
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#4F46E5]/20 bg-[#4F46E5]/5 shadow-sm">
        <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Démo R2 — La Ferme de la Loge
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Focus : lien Swikly 500–800 € (empreinte, pas de débit) + upload
              vidéo .mp4 depuis le téléphone. Pas de plan de table ni CRM
              complet.
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Cautions à envoyer"
          value={String(stats.aEnvoyer)}
          icon={Send}
          accent="amber"
        />
        <MiniStat
          label="Empreintes actives"
          value={String(stats.empreintes)}
          icon={Shield}
          accent="emerald"
        />
        <MiniStat
          label="ÉDL à compléter"
          value={String(stats.edlManquants)}
          icon={Video}
          accent="indigo"
        />
        <MiniStat
          label="Demandes en attente"
          value={String(stats.extras)}
          icon={Bell}
          accent="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Liste */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Prochains week-ends</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {sejours.map((s) => {
                const days = daysUntil(s.dateArrivee);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors sm:px-5",
                        selected.id === s.id
                          ? "bg-[#4F46E5]/5"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{s.couple}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            Arrivée {formatDate(s.dateArrivee)}
                            {days >= 0 ? ` · J-${days}` : " · passé"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                          {formatCurrency(s.cautionAmount)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <SwiklyStatusBadge status={s.swiklyStatus} />
                        {s.extras.some((e) => e.status === "nouvelle") && (
                          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                            Demande
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Détail */}
        <div className="space-y-4">
          {/* Swikly */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{selected.couple}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(selected.dateArrivee)} →{" "}
                    {formatDate(selected.dateDepart)} · {selected.invitees}{" "}
                    invités · {selected.couchages} couchages
                  </p>
                </div>
                <SwiklyStatusBadge status={selected.swiklyStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#4F46E5]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Caution Swikly — empreinte {formatCurrency(selected.cautionAmount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Envoi automatique prévu à J-7 (
                      {formatDate(selected.j7Date)}). L&apos;argent n&apos;est{" "}
                      <strong>pas débité</strong> — juste bloqué pour
                      responsabiliser le couple. Plus de chèque papier, plus de
                      malaise au TPE le vendredi.
                    </p>
                    {jRelatif >= 0 && jRelatif <= 10 && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Arrivée dans {jRelatif} jour{jRelatif > 1 ? "s" : ""} —
                        moment idéal pour envoyer le lien.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selected.swiklyStatus === "a_envoyer" ||
                  selected.swiklyStatus === "expiree") && (
                  <Button
                    className="gap-2"
                    onClick={() => sendSwikly(selected.id)}
                  >
                    <Link2 className="h-4 w-4" />
                    Envoyer le lien Swikly {formatCurrency(selected.cautionAmount)}
                  </Button>
                )}
                {selected.swiklyStatus === "envoye" && (
                  <>
                    <Button
                      className="gap-2"
                      onClick={() => simulateEmpreinte(selected.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Simuler validation empreinte
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => sendSwikly(selected.id)}
                    >
                      <Send className="h-4 w-4" />
                      Renvoyer le lien
                    </Button>
                  </>
                )}
                {selected.swiklyStatus === "empreinte" && (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => liberer(selected.id)}
                  >
                    Libérer la caution
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Destinataire : {selected.email}
              </p>
            </CardContent>
          </Card>

          {/* État des lieux vidéo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4 text-[#4F46E5]" />
                État des lieux vidéo
              </CardTitle>
              <p className="text-sm text-slate-500">
                Comme une location de voiture : filmez en marchant le vendredi
                (entrée) et le dimanche (sortie). La vidéo part aux mariés comme
                preuve.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <EdlBlock
                title="Entrée — vendredi"
                status={selected.edlEntree}
                fileName={selected.edlEntreeFile}
                uploading={uploading === "entree"}
                inputRef={entreeInputRef}
                onPick={() => entreeInputRef.current?.click()}
                onFile={(f) => handleVideo(selected.id, "entree", f)}
                onSend={() => sendEdlToCouple(selected.id, "entree")}
              />
              <EdlBlock
                title="Sortie — dimanche"
                status={selected.edlSortie}
                fileName={selected.edlSortieFile}
                uploading={uploading === "sortie"}
                inputRef={sortieInputRef}
                onPick={() => sortieInputRef.current?.click()}
                onFile={(f) => handleVideo(selected.id, "sortie", f)}
                onSend={() => sendEdlToCouple(selected.id, "sortie")}
              />
            </CardContent>
          </Card>

          {/* Demandes dernière minute */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-[#4F46E5]" />
                Demandes dernière minute
              </CardTitle>
              <p className="text-sm text-slate-500">
                Centralisé ici — plus de post-it ni mails dispersés. Alerte dès
                qu&apos;un couple demande un ajout à facturer.
              </p>
            </CardHeader>
            <CardContent>
              {selected.extras.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  Aucune demande pour ce séjour.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {selected.extras.map((extra) => (
                    <li
                      key={extra.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {extra.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          Demandé le {formatDate(extra.requestedAt)}
                          {extra.status === "nouvelle" && " · nouvelle"}
                          {extra.status === "facturee" && " · facturée"}
                        </p>
                      </div>
                      {extra.status !== "facturee" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            markExtraFacturee(selected.id, extra.id)
                          }
                        >
                          Marquer facturée
                        </Button>
                      )}
                      {extra.status === "facturee" && (
                        <span className="text-xs font-medium text-emerald-700">
                          OK
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
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
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accents[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function EdlBlock({
  title,
  status,
  fileName,
  uploading,
  inputRef,
  onPick,
  onFile,
  onSend,
}: {
  title: string;
  status: EdlStatus;
  fileName?: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: () => void;
  onFile: (file: File | null) => void;
  onSend: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <EdlStatusBadge status={status} />
      </div>
      {fileName && (
        <p className="mt-2 truncate font-mono text-xs text-slate-500">
          {fileName}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/*,.mp4"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={status === "manquant" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          disabled={uploading}
          onClick={onPick}
        >
          <Video className="h-4 w-4" />
          {uploading
            ? "Envoi…"
            : status === "manquant"
              ? "Filmer / importer .mp4"
              : "Remplacer la vidéo"}
        </Button>
        {(status === "enregistree" || status === "envoyee") && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={status === "envoyee"}
            onClick={onSend}
          >
            <Send className="h-4 w-4" />
            {status === "envoyee" ? "Déjà envoyée" : "Envoyer aux mariés"}
          </Button>
        )}
      </div>
    </div>
  );
}
