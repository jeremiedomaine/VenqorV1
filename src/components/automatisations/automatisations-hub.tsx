"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { sendAutomationTestEmail } from "@/actions/automation-test-emails";
import {
  updateDepositAutomationSettings,
  updatePaymentAutomationSettings,
} from "@/actions/automations";
import {
  createRelanceRule,
  deleteRelanceRule,
  updateRelanceRule,
  updateRelancesMasterSwitch,
} from "@/actions/relances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  DEFAULT_ACOMPTE_EMAIL_CTA,
  DEFAULT_ACOMPTE_EMAIL_DETAILS,
  DEFAULT_ACOMPTE_EMAIL_INTRO,
  DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  DEFAULT_ACOMPTE_EMAIL_TITLE,
  DEFAULT_PAYMENT_EMAIL_CTA,
  DEFAULT_PAYMENT_EMAIL_DETAILS,
  DEFAULT_PAYMENT_EMAIL_INTRO,
  DEFAULT_PAYMENT_EMAIL_SUBJECT,
  DEFAULT_PAYMENT_EMAIL_TITLE,
  PAYMENT_EMAIL_VARIABLES,
  type DepositAutomationSettings,
  type PaymentAutomationSettings,
} from "@/lib/automation-settings";
import {
  depositRequestEmailHtml,
  interpolateEmailTemplate,
  paymentRequestEmailHtml,
  relanceEmailHtml,
} from "@/lib/email/templates";
import { RELANCE_STATUT_LABELS } from "@/lib/relance-filters";
import {
  DECLENCHEUR_OPTIONS,
  RELANCE_EMAIL_VARIABLES,
  getRelancePreset,
  relanceEmailContent,
  type RelanceCible,
  type RelanceDeclencheur,
  type RelanceRegle,
} from "@/lib/relance-presets";
import type { EventStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type AutomationCategory = "paiements" | "relances";
type PaymentAutomationId = "acompte" | "solde";

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
  if (declencheur === "echeance_jours_avant") return `J-${delaiJours}`;
  if (declencheur === "echeance_jours_apres") return `J+${delaiJours}`;
  return `J+${delaiJours} contrat`;
}

function CategoryTabs({
  category,
  onChange,
}: {
  category: AutomationCategory;
  onChange: (c: AutomationCategory) => void;
}) {
  const tabs = [
    {
      id: "paiements" as const,
      label: "Emails de paiement",
      description: "Acompte et solde",
    },
    {
      id: "relances" as const,
      label: "Emails de relance",
      description: "Rappels et alertes",
    },
  ];

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/90 p-2 shadow-sm"
      role="tablist"
      aria-label="Type d'automatisation"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tabs.map((tab) => {
          const active = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "rounded-xl px-5 py-4 text-left transition-all duration-200",
                active
                  ? "bg-white text-slate-900 shadow-md ring-2 ring-[#4F46E5]/25"
                  : "bg-white/40 text-slate-600 hover:bg-white/70 hover:text-slate-800",
              )}
            >
              <span
                className={cn(
                  "block text-base font-semibold tracking-tight",
                  active && "text-[#4F46E5]",
                )}
              >
                {tab.label}
              </span>
              <span
                className={cn(
                  "mt-1 block text-sm",
                  active ? "text-slate-600" : "text-slate-500",
                )}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TestEmailButton({
  contactEmail,
  buildFormData,
  disabled,
}: {
  contactEmail: string;
  buildFormData: () => FormData;
  disabled?: boolean;
}) {
  const { pending, run } = useAsyncAction();
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    message: string;
  } | null>(null);

  function handleSend() {
    setFeedback(null);
    void run(async () => {
      const result = await sendAutomationTestEmail(buildFormData());
      if (result.error && !result.sentTo) {
        setFeedback({ type: "err", message: result.error });
        return;
      }
      if (result.error && result.sentTo) {
        setFeedback({
          type: "ok",
          message: `${result.error} (destinataire : ${result.sentTo})`,
        });
        return;
      }
      setFeedback({
        type: "ok",
        message: `Email test envoyé à ${result.sentTo ?? contactEmail}.`,
      });
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || pending || !contactEmail.trim()}
        onClick={handleSend}
      >
        {pending ? "Envoi…" : "Envoyer un email test"}
      </Button>
      {contactEmail ? (
        <p className="text-xs text-slate-500">
          Reçu sur{" "}
          <span className="font-medium text-slate-700">{contactEmail}</span>{" "}
          (contact domaine)
        </p>
      ) : (
        <p className="text-xs text-amber-700">
          Renseignez l&apos;email de contact dans Paramètres pour tester.
        </p>
      )}
      {feedback && (
        <p
          className={cn(
            "text-sm",
            feedback.type === "ok" ? "text-emerald-700" : "text-red-600",
          )}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

function AutomationNavigator({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="order-2 space-y-3 lg:order-2 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-2xl border border-white/70 bg-white/45 p-4 shadow-sm ring-1 ring-slate-200/40 backdrop-blur-md">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <div className="space-y-2">{children}</div>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  label,
  subtitle,
  live,
  onClick,
}: {
  active: boolean;
  label: string;
  subtitle: string;
  live?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
        active
          ? "border-[#4F46E5]/40 bg-white/90 shadow-sm ring-1 ring-[#4F46E5]/15"
          : "border-transparent bg-white/30 hover:border-slate-200/80 hover:bg-white/60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            live ? "bg-emerald-500" : "bg-slate-300",
          )}
        />
        <span className="text-sm font-medium text-slate-900">{label}</span>
      </div>
      <p className="mt-1 pl-4 text-xs text-slate-500">{subtitle}</p>
    </button>
  );
}

function CheckboxChip({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
        checked
          ? "border-[#4F46E5]/30 bg-indigo-50 text-indigo-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-slate-300 text-[#4F46E5]"
      />
      {label}
    </label>
  );
}

function EmailPreview({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      <div>
        <p className="text-sm font-medium text-slate-700">Aperçu de l&apos;email</p>
        <p className="mt-1 text-xs text-slate-500">
          Objet : <span className="font-medium text-slate-700">{subject}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Mise en page Venqor — non modifiable. Personnalisez le contenu à gauche.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <iframe
          title="Aperçu email"
          srcDoc={html}
          className="h-[min(560px,70vh)] w-full border-0"
          sandbox=""
        />
      </div>
    </div>
  );
}

function EmailContentFields({
  title,
  onTitleChange,
  subject,
  onSubjectChange,
  intro,
  onIntroChange,
  ctaLabel,
  onCtaChange,
  details,
  onDetailsChange,
  variables,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  intro: string;
  onIntroChange: (v: string) => void;
  ctaLabel: string;
  onCtaChange: (v: string) => void;
  details: string;
  onDetailsChange: (v: string) => void;
  variables: readonly { key: string }[];
}) {
  const textareaClass =
    "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre dans l&apos;email</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} />
        <p className="text-xs text-slate-500">
          Affiché sous l&apos;en-tête du domaine dans le corps du message.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Objet (boîte mail)</Label>
        <Input value={subject} onChange={(e) => onSubjectChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <textarea
          value={intro}
          onChange={(e) => onIntroChange(e.target.value)}
          rows={7}
          className={textareaClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Libellé du bouton</Label>
          <Input value={ctaLabel} onChange={(e) => onCtaChange(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label>Détails sous le bouton</Label>
          <textarea
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            rows={2}
            className={textareaClass}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Variables : {variables.map((v) => v.key).join(", ")}
      </p>
    </div>
  );
}

export function AutomatisationsHub({
  workspaceName,
  contactEmail,
  soldeSettings,
  acompteSettings,
  relancesActives,
  rules: initialRules,
  relancesUnavailable,
  eventTypeOptions,
}: {
  workspaceName: string;
  contactEmail: string;
  soldeSettings: PaymentAutomationSettings;
  acompteSettings: DepositAutomationSettings;
  relancesActives: boolean;
  rules: RelanceRegle[];
  relancesUnavailable: string | null;
  eventTypeOptions: Array<{ slug: string; label: string; builtin: boolean }>;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<AutomationCategory>("paiements");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentAutomationId>("acompte");
  const [selectedRelanceId, setSelectedRelanceId] = useState<string | null>(
    initialRules[0]?.id ?? null,
  );
  const [rules, setRules] = useState(initialRules);
  const [relancesActive, setRelancesActive] = useState(relancesActives);
  const { pending, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRules(initialRules);
    setSelectedRelanceId((current) => {
      if (current && initialRules.some((r) => r.id === current)) return current;
      return initialRules[0]?.id ?? null;
    });
  }, [initialRules]);

  // —— Payment: acompte state
  const [acompteActive, setAcompteActive] = useState(
    acompteSettings.automation_acompte_active,
  );
  const [acompteTiming, setAcompteTiming] = useState(
    acompteSettings.acompte_signature_timing,
  );
  const [acompteTitle, setAcompteTitle] = useState(
    acompteSettings.email_acompte_titre || DEFAULT_ACOMPTE_EMAIL_TITLE,
  );
  const [acompteSubject, setAcompteSubject] = useState(
    acompteSettings.email_acompte_objet || DEFAULT_ACOMPTE_EMAIL_SUBJECT,
  );
  const [acompteIntro, setAcompteIntro] = useState(
    acompteSettings.email_acompte_intro || DEFAULT_ACOMPTE_EMAIL_INTRO,
  );
  const [acompteCta, setAcompteCta] = useState(
    acompteSettings.email_acompte_cta || DEFAULT_ACOMPTE_EMAIL_CTA,
  );
  const [acompteDetails, setAcompteDetails] = useState(
    acompteSettings.email_acompte_details || DEFAULT_ACOMPTE_EMAIL_DETAILS,
  );

  // —— Payment: solde state
  const [soldeActive, setSoldeActive] = useState(
    soldeSettings.automation_paiement_active,
  );
  const [soldeTitle, setSoldeTitle] = useState(
    soldeSettings.email_paiement_titre || DEFAULT_PAYMENT_EMAIL_TITLE,
  );
  const [soldeSubject, setSoldeSubject] = useState(
    soldeSettings.email_paiement_objet || DEFAULT_PAYMENT_EMAIL_SUBJECT,
  );
  const [soldeIntro, setSoldeIntro] = useState(
    soldeSettings.email_paiement_intro || DEFAULT_PAYMENT_EMAIL_INTRO,
  );
  const [soldeCta, setSoldeCta] = useState(
    soldeSettings.email_paiement_cta || DEFAULT_PAYMENT_EMAIL_CTA,
  );
  const [soldeDetails, setSoldeDetails] = useState(
    soldeSettings.email_paiement_details || DEFAULT_PAYMENT_EMAIL_DETAILS,
  );

  const selectedRule = useMemo(
    () => rules.find((r) => r.id === selectedRelanceId) ?? null,
    [rules, selectedRelanceId],
  );

  const paymentItems = [
    {
      id: "acompte" as const,
      label: "Demande d'acompte",
      subtitle: acompteActive ? "Actif" : "Inactif",
      active: acompteActive,
    },
    {
      id: "solde" as const,
      label: "Demande de solde (J-30)",
      subtitle: soldeActive ? "Actif" : "Inactif",
      active: soldeActive,
    },
  ];

  function switchCategory(next: AutomationCategory) {
    setCategory(next);
    setError(null);
    if (next === "relances" && !selectedRelanceId && rules[0]) {
      setSelectedRelanceId(rules[0].id);
    }
  }

  function buildPaymentPreview(
    type: PaymentAutomationId,
  ): { subject: string; html: string } {
    const vars = { ...PREVIEW_VARS, domaine: workspaceName };
    if (type === "acompte") {
      return {
        subject: interpolateEmailTemplate(acompteSubject, vars),
        html: depositRequestEmailHtml(
          vars,
          interpolateEmailTemplate(acompteIntro, vars),
          {
            title: acompteTitle,
            ctaLabel: acompteCta,
            footerNote: acompteDetails,
          },
        ),
      };
    }
    return {
      subject: interpolateEmailTemplate(soldeSubject, {
        ...vars,
        montant: formatCurrency(3500),
        libelle: "Solde",
      }),
      html: paymentRequestEmailHtml(
        { ...vars, montant: formatCurrency(3500), libelle: "Solde" },
        interpolateEmailTemplate(soldeIntro, vars),
        {
          title: soldeTitle,
          ctaLabel: soldeCta,
          footerNote: soldeDetails,
        },
      ),
    };
  }

  function handleSavePayment(type: PaymentAutomationId) {
    setError(null);
    void run(async () => {
      const fd = new FormData();
      if (type === "acompte") {
        fd.set("automation_acompte_active", acompteActive ? "on" : "off");
        fd.set("acompte_signature_timing", acompteTiming);
        fd.set("email_acompte_titre", acompteTitle);
        fd.set("email_acompte_objet", acompteSubject);
        fd.set("email_acompte_intro", acompteIntro);
        fd.set("email_acompte_cta", acompteCta);
        fd.set("email_acompte_details", acompteDetails);
        const result = await updateDepositAutomationSettings(fd);
        if (result.error) setError(result.error);
      } else {
        fd.set("automation_paiement_active", soldeActive ? "on" : "off");
        fd.set("email_paiement_titre", soldeTitle);
        fd.set("email_paiement_objet", soldeSubject);
        fd.set("email_paiement_intro", soldeIntro);
        fd.set("email_paiement_cta", soldeCta);
        fd.set("email_paiement_details", soldeDetails);
        const result = await updatePaymentAutomationSettings(fd);
        if (result.error) setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <CategoryTabs category={category} onChange={switchCategory} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Éditeur principal */}
        <section className="order-1 min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:order-1">
          {category === "paiements" && selectedPayment === "acompte" && (
            <PaymentEditor
              type="acompte"
              active={acompteActive}
              onActiveChange={setAcompteActive}
              timing={acompteTiming}
              onTimingChange={setAcompteTiming}
              title={acompteTitle}
              onTitleChange={setAcompteTitle}
              subject={acompteSubject}
              onSubjectChange={setAcompteSubject}
              intro={acompteIntro}
              onIntroChange={setAcompteIntro}
              ctaLabel={acompteCta}
              onCtaChange={setAcompteCta}
              details={acompteDetails}
              onDetailsChange={setAcompteDetails}
              preview={buildPaymentPreview("acompte")}
              contactEmail={contactEmail}
              error={error}
              pending={pending}
              onSave={() => handleSavePayment("acompte")}
            />
          )}

          {category === "paiements" && selectedPayment === "solde" && (
            <PaymentEditor
              type="solde"
              active={soldeActive}
              onActiveChange={setSoldeActive}
              title={soldeTitle}
              onTitleChange={setSoldeTitle}
              subject={soldeSubject}
              onSubjectChange={setSoldeSubject}
              intro={soldeIntro}
              onIntroChange={setSoldeIntro}
              ctaLabel={soldeCta}
              onCtaChange={setSoldeCta}
              details={soldeDetails}
              onDetailsChange={setSoldeDetails}
              preview={buildPaymentPreview("solde")}
              contactEmail={contactEmail}
              error={error}
              pending={pending}
              onSave={() => handleSavePayment("solde")}
            />
          )}

          {category === "relances" && selectedRule && !relancesUnavailable && (
            <RelanceEditor
              key={selectedRule.id}
              rule={selectedRule}
              workspaceName={workspaceName}
              eventTypeOptions={eventTypeOptions}
              contactEmail={contactEmail}
              error={error}
              pending={pending}
              onError={setError}
              onDeleted={() => {
                setRules((prev) => prev.filter((r) => r.id !== selectedRule.id));
                setSelectedRelanceId(
                  rules.find((r) => r.id !== selectedRule.id)?.id ?? null,
                );
                router.refresh();
              }}
              onUpdated={(updated) => {
                setRules((prev) =>
                  prev.map((r) => (r.id === updated.id ? updated : r)),
                );
              }}
            />
          )}

          {category === "relances" && !selectedRule && !relancesUnavailable && (
            <p className="text-sm text-slate-500">
              Sélectionnez une automatisation ou créez-en une nouvelle.
            </p>
          )}
        </section>

        <AutomationNavigator
          title={
            category === "paiements"
              ? "Vos automatisations"
              : "Vos relances"
          }
        >
          {category === "paiements" &&
            paymentItems.map((item) => (
              <NavItem
                key={item.id}
                active={selectedPayment === item.id}
                label={item.label}
                subtitle={item.subtitle}
                live={item.active}
                onClick={() => {
                  setSelectedPayment(item.id);
                  setError(null);
                }}
              />
            ))}

          {category === "relances" && (
            <>
              {relancesUnavailable ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                  {relancesUnavailable}
                </p>
              ) : (
                <>
                  <label className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/50 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={relancesActive}
                      onChange={(e) => {
                        setRelancesActive(e.target.checked);
                        void run(async () => {
                          const fd = new FormData();
                          fd.set(
                            "relances_actives",
                            e.target.checked ? "on" : "off",
                          );
                          await updateRelancesMasterSwitch(fd);
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
                    />
                    <span className="text-slate-700">Relances activées</span>
                  </label>

                  {rules.map((rule) => (
                    <NavItem
                      key={rule.id}
                      active={selectedRelanceId === rule.id}
                      label={rule.nom}
                      subtitle={`${delayLabel(rule.declencheur, rule.delai_jours)} · ${rule.cible === "couple" ? "Couple" : "Domaine"}`}
                      live={rule.active}
                      onClick={() => {
                        setSelectedRelanceId(rule.id);
                        setError(null);
                      }}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/50"
                    disabled={pending}
                    onClick={() => {
                      void run(async () => {
                        const result = await createRelanceRule();
                        if (result.error) {
                          setError(result.error);
                          return;
                        }
                        if (result.id) {
                          setSelectedRelanceId(result.id);
                        }
                        router.refresh();
                      });
                    }}
                  >
                    + Nouvelle automatisation
                  </Button>
                </>
              )}
            </>
          )}
        </AutomationNavigator>
      </div>
    </div>
  );
}

function PaymentEditor({
  type,
  active,
  onActiveChange,
  timing,
  onTimingChange,
  title,
  onTitleChange,
  subject,
  onSubjectChange,
  intro,
  onIntroChange,
  ctaLabel,
  onCtaChange,
  details,
  onDetailsChange,
  preview,
  contactEmail,
  error,
  pending,
  onSave,
}: {
  type: PaymentAutomationId;
  active: boolean;
  onActiveChange: (v: boolean) => void;
  timing?: "with_contract" | "after_contract";
  onTimingChange?: (v: "with_contract" | "after_contract") => void;
  title: string;
  onTitleChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  intro: string;
  onIntroChange: (v: string) => void;
  ctaLabel: string;
  onCtaChange: (v: string) => void;
  details: string;
  onDetailsChange: (v: string) => void;
  preview: { subject: string; html: string };
  contactEmail: string;
  error: string | null;
  pending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {type === "acompte" ? "Demande d'acompte" : "Demande de solde (J-30)"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {type === "acompte"
            ? "Envoyé au couple pour le règlement de l'acompte, en lien avec la signature Signable."
            : "Envoyé automatiquement quand le mariage est à 30 jours ou moins."}
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onActiveChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
        />
        <span className="text-sm text-slate-700">Automatisation active</span>
      </label>

      {type === "acompte" && timing && onTimingChange && (
        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-900">
            Quand envoyer ?
          </legend>
          {(
            [
              {
                value: "after_contract" as const,
                label: "Après signature du contrat",
                hint: "Quand les deux mariés ont signé (recommandé).",
              },
              {
                value: "with_contract" as const,
                label: "Avec le contrat",
                hint: "Dès l'envoi Signable depuis le dossier.",
              },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                checked={timing === opt.value}
                onChange={() => onTimingChange(opt.value)}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                <span className="font-medium">{opt.label}</span>
                <span className="mt-0.5 block text-slate-500">{opt.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <EmailContentFields
          title={title}
          onTitleChange={onTitleChange}
          subject={subject}
          onSubjectChange={onSubjectChange}
          intro={intro}
          onIntroChange={onIntroChange}
          ctaLabel={ctaLabel}
          onCtaChange={onCtaChange}
          details={details}
          onDetailsChange={onDetailsChange}
          variables={PAYMENT_EMAIL_VARIABLES}
        />
        <EmailPreview subject={preview.subject} html={preview.html} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 pt-6">
        <Button type="button" disabled={pending} onClick={onSave}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <TestEmailButton
          contactEmail={contactEmail}
          disabled={pending}
          buildFormData={() => {
            const fd = new FormData();
            fd.set("kind", type === "acompte" ? "payment_acompte" : "payment_solde");
            fd.set("email_titre", title);
            fd.set("email_objet", subject);
            fd.set("email_intro", intro);
            fd.set("email_cta_label", ctaLabel);
            fd.set("email_footer_note", details);
            return fd;
          }}
        />
      </div>
    </div>
  );
}
function RelanceEditor({
  rule,
  workspaceName,
  eventTypeOptions,
  contactEmail,
  error,
  pending,
  onError,
  onDeleted,
  onUpdated,
}: {
  rule: RelanceRegle;
  workspaceName: string;
  eventTypeOptions: Array<{ slug: string; label: string; builtin: boolean }>;
  contactEmail: string;
  error: string | null;
  pending: boolean;
  onError: (msg: string | null) => void;
  onDeleted: () => void;
  onUpdated: (rule: RelanceRegle) => void;
}) {
  const preset = getRelancePreset(rule.preset_key);
  const content = relanceEmailContent(rule);
  const { pending: actionPending, run } = useAsyncAction();

  const [nom, setNom] = useState(rule.nom);
  const [active, setActive] = useState(rule.active);
  const [declencheur, setDeclencheur] = useState<RelanceDeclencheur>(
    rule.declencheur,
  );
  const [cible, setCible] = useState<RelanceCible>(rule.cible);
  const [delaiJours, setDelaiJours] = useState(String(rule.delai_jours));
  const [allEventTypes, setAllEventTypes] = useState(
    !rule.types_evenement?.length,
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    rule.types_evenement ?? [],
  );
  const [selectedStatuts, setSelectedStatuts] = useState<EventStatus[]>(
    (rule.statuts_evenement ?? ["option", "confirme"]) as EventStatus[],
  );
  const [title, setTitle] = useState(content.title);
  const [subject, setSubject] = useState(rule.email_objet);
  const [intro, setIntro] = useState(rule.email_intro);
  const [ctaLabel, setCtaLabel] = useState(content.ctaLabel);
  const [details, setDetails] = useState(rule.email_footer_note ?? "");

  const previewVars = {
    ...PREVIEW_VARS,
    domaine: workspaceName,
    delai_jours: delaiJours,
  };
  const previewSubject = interpolateEmailTemplate(subject, previewVars);
  const previewHtml = relanceEmailHtml({
    domainName: workspaceName,
    title,
    introText: interpolateEmailTemplate(intro, previewVars),
    ctaLabel,
    ctaHref: PREVIEW_VARS.lien_paiement,
    footerNote: details || undefined,
    paymentRelated: declencheur !== "contrat_jours_apres",
  });

  function toggleType(slug: string, checked: boolean) {
    setSelectedTypes((prev) =>
      checked ? [...prev, slug] : prev.filter((s) => s !== slug),
    );
  }

  function toggleStatut(statut: EventStatus, checked: boolean) {
    setSelectedStatuts((prev) =>
      checked ? [...prev, statut] : prev.filter((s) => s !== statut),
    );
  }

  function handleSave() {
    onError(null);
    if (!allEventTypes && !selectedTypes.length) {
      onError("Sélectionnez au moins un type d'événement ou cochez « Tous les types ».");
      return;
    }
    if (!selectedStatuts.length) {
      onError("Sélectionnez au moins un statut de dossier.");
      return;
    }
    void run(async () => {
      const fd = new FormData();
      fd.set("rule_id", rule.id);
      fd.set("nom", nom);
      fd.set("active", active ? "on" : "off");
      fd.set("declencheur", declencheur);
      fd.set("cible", cible);
      fd.set("delai_jours", delaiJours);
      fd.set(
        "types_evenement",
        allEventTypes ? "" : selectedTypes.join(","),
      );
      fd.set("statuts_evenement", selectedStatuts.join(","));
      fd.set("email_titre", title);
      fd.set("email_objet", subject);
      fd.set("email_intro", intro);
      fd.set("email_cta_label", ctaLabel);
      fd.set("email_footer_note", details);
      const result = await updateRelanceRule(fd);
      if (result.error) {
        onError(result.error);
        return;
      }
      onUpdated({
        ...rule,
        nom,
        active,
        declencheur,
        cible,
        delai_jours: Number(delaiJours),
        types_evenement: allEventTypes ? [] : selectedTypes,
        statuts_evenement: selectedStatuts,
        email_titre: title,
        email_objet: subject,
        email_intro: intro,
        email_cta_label: ctaLabel,
        email_footer_note: details || null,
      });
    });
  }

  function handleDelete() {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    onError(null);
    void run(async () => {
      const fd = new FormData();
      fd.set("rule_id", rule.id);
      const result = await deleteRelanceRule(fd);
      if (result.error) onError(result.error);
      else onDeleted();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{nom}</h2>
          {preset?.description && (
            <p className="mt-1 text-sm text-slate-500">{preset.description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          disabled={actionPending}
          onClick={handleDelete}
        >
          Supprimer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom (liste)</Label>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Destinataire</Label>
          <select
            value={cible}
            onChange={(e) => setCible(e.target.value as RelanceCible)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
          >
            <option value="couple">Couple</option>
            <option value="domaine">Domaine (gérant)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Déclencheur</Label>
        <select
          value={declencheur}
          onChange={(e) =>
            setDeclencheur(e.target.value as RelanceDeclencheur)
          }
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
        >
          {DECLENCHEUR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          {DECLENCHEUR_OPTIONS.find((o) => o.value === declencheur)?.hint}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Délai (jours)</Label>
        <Input
          type="number"
          min={declencheur === "echeance_jours_avant" ? 1 : 0}
          max={365}
          value={delaiJours}
          onChange={(e) => setDelaiJours(e.target.value)}
          className="max-w-[140px]"
        />
        <p className="text-xs text-slate-500">
          {delayLabel(declencheur, Number(delaiJours) || rule.delai_jours)}
        </p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-900">
          Types d&apos;événement concernés
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={allEventTypes}
            onChange={(e) => {
              setAllEventTypes(e.target.checked);
              if (e.target.checked) setSelectedTypes([]);
            }}
            className="h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
          />
          Tous les types
        </label>
        {!allEventTypes && (
          <div className="flex flex-wrap gap-2">
            {eventTypeOptions.map((type) => (
              <CheckboxChip
                key={type.slug}
                label={type.label}
                checked={selectedTypes.includes(type.slug)}
                onChange={(checked) => toggleType(type.slug, checked)}
              />
            ))}
          </div>
        )}
        {!allEventTypes && !selectedTypes.length && (
          <p className="text-xs text-amber-700">
            Sélectionnez au moins un type ou cochez « Tous les types ».
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-900">
          Statuts de dossier éligibles
        </legend>
        <div className="flex flex-wrap gap-2">
          {(
            Object.entries(RELANCE_STATUT_LABELS) as [EventStatus, string][]
          ).map(([statut, label]) => (
            <CheckboxChip
              key={statut}
              label={label}
              checked={selectedStatuts.includes(statut)}
              onChange={(checked) => toggleStatut(statut, checked)}
            />
          ))}
        </div>
        {!selectedStatuts.length && (
          <p className="text-xs text-amber-700">
            Sélectionnez au moins un statut.
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#4F46E5]"
        />
        <span className="text-sm text-slate-700">Automatisation active</span>
      </label>

      <div className="grid gap-8 xl:grid-cols-2">
        <EmailContentFields
          title={title}
          onTitleChange={setTitle}
          subject={subject}
          onSubjectChange={setSubject}
          intro={intro}
          onIntroChange={setIntro}
          ctaLabel={ctaLabel}
          onCtaChange={setCtaLabel}
          details={details}
          onDetailsChange={setDetails}
          variables={RELANCE_EMAIL_VARIABLES}
        />
        <EmailPreview subject={previewSubject} html={previewHtml} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 pt-6">
        <Button
          type="button"
          disabled={pending || actionPending}
          onClick={handleSave}
        >
          {pending || actionPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <TestEmailButton
          contactEmail={contactEmail}
          disabled={pending || actionPending}
          buildFormData={() => {
            const fd = new FormData();
            fd.set("kind", "relance");
            fd.set("declencheur", declencheur);
            fd.set("email_titre", title);
            fd.set("email_objet", subject);
            fd.set("email_intro", intro);
            fd.set("email_cta_label", ctaLabel);
            fd.set("email_footer_note", details);
            return fd;
          }}
        />
      </div>
    </div>
  );
}
