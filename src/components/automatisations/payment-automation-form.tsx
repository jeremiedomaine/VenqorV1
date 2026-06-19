"use client";

import { useState, useTransition } from "react";
import { updatePaymentAutomationSettings } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PAYMENT_EMAIL_INTRO,
  DEFAULT_PAYMENT_EMAIL_SUBJECT,
  PAYMENT_EMAIL_VARIABLES,
  type PaymentAutomationSettings,
} from "@/lib/automation-settings";
import {
  interpolateEmailTemplate,
  paymentRequestEmailHtml,
} from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

const PREVIEW_VARS = {
  domaine: "Domaine Les Chênes",
  couple: "Alice & Martin",
  montant: formatCurrency(4500),
  libelle: "Acompte 30 %",
  lien_paiement: "https://venqor.fr/portail/exemple/paiement",
  contact_domaine: "contact@domaine.fr",
};

export function PaymentAutomationForm({
  settings,
  workspaceName,
}: {
  settings: PaymentAutomationSettings;
  workspaceName: string;
}) {
  const [active, setActive] = useState(settings.automation_paiement_active);
  const [subject, setSubject] = useState(
    settings.email_paiement_objet || DEFAULT_PAYMENT_EMAIL_SUBJECT,
  );
  const [intro, setIntro] = useState(
    settings.email_paiement_intro || DEFAULT_PAYMENT_EMAIL_INTRO,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewSubject = interpolateEmailTemplate(subject, {
    ...PREVIEW_VARS,
    domaine: workspaceName,
  });
  const previewIntro = interpolateEmailTemplate(intro, {
    ...PREVIEW_VARS,
    domaine: workspaceName,
  });
  const previewHtml = paymentRequestEmailHtml(
    { ...PREVIEW_VARS, domaine: workspaceName },
    previewIntro,
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentAutomationSettings(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={handleSubmit} className="space-y-6">
        <input
          type="hidden"
          name="automation_paiement_active"
          value={active ? "on" : "off"}
        />
        <input type="hidden" name="email_paiement_objet" value={subject} />
        <input type="hidden" name="email_paiement_intro" value={intro} />

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              Envoi automatique à la date bloquée
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Quand un prospect passe en date bloquée et qu&apos;un échéancier
              est généré, Venqor envoie l&apos;email de paiement au couple.
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="email_paiement_objet">Objet de l&apos;email</Label>
          <Input
            id="email_paiement_objet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_paiement_intro">Message d&apos;introduction</Label>
          <textarea
            id="email_paiement_intro"
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
          {pending ? "Enregistrement…" : "Enregistrer l'automatisation"}
        </Button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Aperçu de l&apos;email</p>
        <p className="text-xs text-slate-500">
          Objet : <span className="font-medium text-slate-700">{previewSubject}</span>
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Aperçu email paiement"
            srcDoc={previewHtml}
            className="h-[520px] w-full border-0"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
