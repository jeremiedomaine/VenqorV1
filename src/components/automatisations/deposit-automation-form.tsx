"use client";

import { useState } from "react";
import { updateDepositAutomationSettings } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  DEFAULT_ACOMPTE_EMAIL_INTRO,
  DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  PAYMENT_EMAIL_VARIABLES,
  type DepositAutomationSettings,
} from "@/lib/automation-settings";
import {
  interpolateEmailTemplate,
  depositRequestEmailHtml,
} from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

const PREVIEW_VARS = {
  domaine: "Domaine Les Chênes",
  couple: "Alice & Martin",
  montant: formatCurrency(1500),
  libelle: "Acompte",
  lien_paiement: "https://venqor.fr/portail/exemple/paiement",
  contact_domaine: "contact@domaine.fr",
};

export function DepositAutomationForm({
  settings,
  workspaceName,
}: {
  settings: DepositAutomationSettings;
  workspaceName: string;
}) {
  const [active, setActive] = useState(settings.automation_acompte_active);
  const [timing, setTiming] = useState(settings.acompte_signature_timing);
  const [subject, setSubject] = useState(
    settings.email_acompte_objet || DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  );
  const [intro, setIntro] = useState(
    settings.email_acompte_intro || DEFAULT_ACOMPTE_EMAIL_INTRO,
  );
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  const previewSubject = interpolateEmailTemplate(subject, {
    ...PREVIEW_VARS,
    domaine: workspaceName,
  });
  const previewIntro = interpolateEmailTemplate(intro, {
    ...PREVIEW_VARS,
    domaine: workspaceName,
  });
  const previewHtml = depositRequestEmailHtml(
    { ...PREVIEW_VARS, domaine: workspaceName },
    previewIntro,
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateDepositAutomationSettings(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={handleSubmit} className="space-y-6">
        <input
          type="hidden"
          name="automation_acompte_active"
          value={active ? "on" : "off"}
        />
        <input type="hidden" name="acompte_signature_timing" value={timing} />
        <input type="hidden" name="email_acompte_objet" value={subject} />
        <input type="hidden" name="email_acompte_intro" value={intro} />

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              Envoi automatique de l&apos;email acompte
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Venqor envoie au couple l&apos;email de règlement de l&apos;acompte
              avec le lien vers la page de paiement, selon le timing choisi
              ci-dessous.
            </span>
          </span>
        </label>

        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-900">
            Quand envoyer l&apos;email acompte ?
          </legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="timing_ui"
              checked={timing === "after_contract"}
              onChange={() => setTiming("after_contract")}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              <span className="font-medium">Après signature du contrat</span>
              <span className="mt-0.5 block text-slate-500">
                Quand les deux mariés ont signé via Yousign (recommandé).
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="timing_ui"
              checked={timing === "with_contract"}
              onChange={() => setTiming("with_contract")}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              <span className="font-medium">En même temps que le contrat</span>
              <span className="mt-0.5 block text-slate-500">
                Dès que vous cliquez « Envoyer le contrat » sur le dossier.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="email_acompte_objet">Objet de l&apos;email</Label>
          <Input
            id="email_acompte_objet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_acompte_intro">Message d&apos;introduction</Label>
          <textarea
            id="email_acompte_intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={8}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
          />
          <p className="text-xs text-slate-500">
            Variables disponibles :{" "}
            {PAYMENT_EMAIL_VARIABLES.map((v) => v.key).join(", ")}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'automatisation acompte"}
        </Button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Aperçu de l&apos;email</p>
        <p className="text-xs text-slate-500">
          Objet : <span className="font-medium text-slate-700">{previewSubject}</span>
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Aperçu email acompte"
            srcDoc={previewHtml}
            className="h-[520px] w-full border-0"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
