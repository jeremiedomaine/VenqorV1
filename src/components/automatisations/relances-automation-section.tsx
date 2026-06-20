"use client";

import { useState } from "react";
import {
  updateRelanceRule,
  updateRelancesMasterSwitch,
} from "@/actions/relances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  getRelancePreset,
  RELANCE_EMAIL_VARIABLES,
  type RelanceDeclencheur,
  type RelanceRegle,
} from "@/lib/relance-presets";
import {
  interpolateEmailTemplate,
  relanceEmailHtml,
} from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

const PREVIEW_VARS = {
  domaine: "Domaine Les Chênes",
  couple: "Alice & Martin",
  montant: formatCurrency(1500),
  libelle: "Acompte",
  lien_paiement: "https://app.venqor.app/portail/exemple/paiement",
  contact_domaine: "contact@domaine.fr",
  date_echeance: "15 septembre 2026",
  delai_jours: "7",
};

function delayLabel(
  declencheur: RelanceDeclencheur,
  delaiJours: number,
): string {
  if (declencheur === "echeance_jours_avant") {
    return `J-${delaiJours} (avant échéance)`;
  }
  if (declencheur === "echeance_jours_apres") {
    return `J+${delaiJours} (après échéance)`;
  }
  return `${delaiJours} j. après envoi du contrat`;
}

function RelanceRuleForm({
  rule,
  workspaceName,
}: {
  rule: RelanceRegle;
  workspaceName: string;
}) {
  const preset = getRelancePreset(rule.preset_key);
  const [active, setActive] = useState(rule.active);
  const [delaiJours, setDelaiJours] = useState(String(rule.delai_jours));
  const [subject, setSubject] = useState(rule.email_objet);
  const [intro, setIntro] = useState(rule.email_intro);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  const previewVars = {
    ...PREVIEW_VARS,
    domaine: workspaceName,
    delai_jours: delaiJours,
  };
  const previewSubject = interpolateEmailTemplate(subject, previewVars);
  const previewIntro = interpolateEmailTemplate(intro, previewVars);
  const previewHtml = relanceEmailHtml({
    domainName: workspaceName,
    title: preset?.email_title ?? rule.nom,
    introText: previewIntro,
    ctaLabel: preset?.cta_label ?? "Voir",
    ctaHref: PREVIEW_VARS.lien_paiement,
    paymentRelated: rule.declencheur !== "contrat_jours_apres",
  });

  function handleSubmit(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateRelanceRule(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <article className="rounded-lg border border-slate-200 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-900">{rule.nom}</h3>
          {preset?.description && (
            <p className="mt-1 text-sm text-slate-500">{preset.description}</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Destinataire :{" "}
            {rule.cible === "couple" ? "Couple" : "Domaine (gérant)"} ·{" "}
            {delayLabel(rule.declencheur, Number(delaiJours) || rule.delai_jours)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="rule_id" value={rule.id} />
          <input type="hidden" name="preset_key" value={rule.preset_key} />
          <input type="hidden" name="active" value={active ? "on" : "off"} />
          <input type="hidden" name="email_objet" value={subject} />
          <input type="hidden" name="email_intro" value={intro} />

          <label className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
            />
            <span className="text-sm text-slate-700">Règle active</span>
          </label>

          <div className="space-y-2">
            <Label htmlFor={`delai_${rule.id}`}>Délai (jours)</Label>
            <Input
              id={`delai_${rule.id}`}
              name="delai_jours"
              type="number"
              min={rule.declencheur === "echeance_jours_avant" ? 1 : 0}
              max={365}
              value={delaiJours}
              onChange={(e) => setDelaiJours(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              {rule.declencheur === "echeance_jours_avant"
                ? "Nombre de jours avant la date d'échéance."
                : rule.declencheur === "echeance_jours_apres"
                  ? "Nombre de jours après la date d'échéance."
                  : "Nombre de jours après l'envoi du contrat Yousign."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`objet_${rule.id}`}>Objet</Label>
            <Input
              id={`objet_${rule.id}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`intro_${rule.id}`}>Message</Label>
            <textarea
              id={`intro_${rule.id}`}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={6}
              className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            />
            <p className="text-xs text-slate-500">
              Variables :{" "}
              {RELANCE_EMAIL_VARIABLES.map((v) => v.key).join(", ")}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Aperçu</p>
          <p className="text-xs text-slate-500">
            Objet :{" "}
            <span className="font-medium text-slate-700">{previewSubject}</span>
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <iframe
              title={`Aperçu ${rule.nom}`}
              srcDoc={previewHtml}
              className="h-[360px] w-full border-0"
              sandbox=""
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function RelancesAutomationSection({
  relancesActives,
  rules,
  workspaceName,
}: {
  relancesActives: boolean;
  rules: RelanceRegle[];
  workspaceName: string;
}) {
  const [masterActive, setMasterActive] = useState(relancesActives);
  const [masterError, setMasterError] = useState<string | null>(null);
  const { pending: masterPending, run: runMaster } = useAsyncAction();

  function handleMasterSubmit(formData: FormData) {
    setMasterError(null);
    void runMaster(async () => {
      const result = await updateRelancesMasterSwitch(formData);
      if (result.error) setMasterError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <form action={handleMasterSubmit}>
        <input
          type="hidden"
          name="relances_actives"
          value={masterActive ? "on" : "off"}
        />
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={masterActive}
            onChange={(e) => setMasterActive(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              Relances automatiques activées
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Interrupteur global pour les rappels et relances ci-dessous.
              Les emails instantanés (déclaration de virement, solde J-30)
              restent gérés séparément.
            </span>
          </span>
        </label>
        {masterError && (
          <p className="mt-2 text-sm text-red-600">{masterError}</p>
        )}
        <Button type="submit" size="sm" className="mt-3" disabled={masterPending}>
          {masterPending ? "Enregistrement…" : "Enregistrer l'interrupteur"}
        </Button>
      </form>

      <div className="space-y-4">
        {rules.map((rule) => (
          <RelanceRuleForm
            key={rule.id}
            rule={rule}
            workspaceName={workspaceName}
          />
        ))}
      </div>
    </div>
  );
}
