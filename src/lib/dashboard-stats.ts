import type { Event, Payment } from "@/lib/types";
import { SIGNED_EVENT_STATUSES } from "@/lib/types";
import { NEUTRAL_COPY } from "@/lib/event-copy";

export interface DashboardAlert {
  id: string;
  severity: "warning" | "info";
  title: string;
  description: string;
  href: string;
}

export interface MonthlySlot {
  month: number;
  label: string;
  confirmedActiveCount: number;
  closedCount: number;
  bookedRevenue: number;
  optionCount: number;
  /** Date bloquée + confirmés + clôturés (pilotage). */
  engagedCount: number;
  engagedRevenue: number;
  optionRevenue: number;
  confirmedActiveRevenue: number;
  closedRevenue: number;
}

export interface YearProjection {
  year: number;
  bookedCount: number;
  bookedRevenue: number;
  confirmedActiveCount: number;
  closedCount: number;
  closedRevenue: number;
  optionCount: number;
  optionRevenue: number;
  /** Date bloquée + confirmés + clôturés (pilotage). */
  engagedCount: number;
  engagedRevenue: number;
  prospectCount: number;
  collected: number;
  pending: number;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface YearDetail {
  year: number;
  /** Confirmés actifs + clôturés — CA réel de l'année */
  booked: { count: number; revenue: number };
  confirmedActive: { count: number; revenue: number };
  closed: { count: number; revenue: number };
  option: { count: number; revenue: number };
  /** Date bloquée + confirmés + clôturés — vue pilotage annuelle. */
  engaged: { count: number; revenue: number };
  prospect: { count: number; revenue: number };
  collections: { paid: number; pending: number; rate: number };
  monthly: MonthlySlot[];
  vsPreviousYear: { revenuePct: number; countPct: number } | null;
}

export interface DashboardStats {
  pipeline: { count: number; value: number };
  signed: { count: number; value: number };
  collections: {
    pending: number;
    paid: number;
    rate: number;
  };
  overdue: { count: number; amount: number };
  nextWedding: {
    id: string;
    nom: string;
    date: string;
    daysUntil: number;
    statut: Event["statut"];
  } | null;
  byStatus: Record<Event["statut"], number>;
  closedCount: number;
  alerts: DashboardAlert[];
  selectedYear: number;
  availableYears: number[];
  yearDetail: YearDetail;
  projections: YearProjection[];
}

const MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = startOfToday();
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function eventYear(event: Event): number | null {
  if (!event.date_debut) return null;
  return new Date(event.date_debut).getFullYear();
}

function eventMonth(event: Event): number | null {
  if (!event.date_debut) return null;
  return new Date(event.date_debut).getMonth() + 1;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildAvailableYears(events: Event[], currentYear: number): number[] {
  const fromEvents = events
    .map((e) => eventYear(e))
    .filter((y): y is number => y !== null);

  const min =
    fromEvents.length > 0
      ? Math.min(currentYear - 1, ...fromEvents)
      : currentYear - 1;
  const max =
    fromEvents.length > 0
      ? Math.max(currentYear + 3, ...fromEvents)
      : currentYear + 3;

  const years: number[] = [];
  for (let y = min; y <= max; y++) years.push(y);
  return years;
}

function paymentsForEvents(payments: Payment[], eventIds: Set<string>) {
  return payments.filter((p) => eventIds.has(p.event_id));
}

function splitYearEvents(inYear: Event[]) {
  const confirmedActive = inYear.filter(
    (e) => e.statut === "confirme" && !e.cloture_at,
  );
  const closed = inYear.filter((e) => e.cloture_at);
  const option = inYear.filter((e) => e.statut === "option");
  const prospect = inYear.filter((e) => e.statut === "prospect");
  const booked = [...confirmedActive, ...closed];

  return { confirmedActive, closed, option, prospect, booked };
}

function sumPrice(list: Event[]) {
  return list.reduce((s, e) => s + Number(e.prix_total), 0);
}

/** Dossiers engagés : date bloquée ou étape suivante (confirmé, clôturé). */
function engagedEvents(list: Event[]) {
  return list.filter((e) => e.statut !== "prospect");
}

function computeYearDetail(
  events: Event[],
  payments: Payment[],
  year: number,
): YearDetail {
  const inYear = events.filter((e) => eventYear(e) === year);
  const { confirmedActive, closed, option, prospect, booked } =
    splitYearEvents(inYear);
  const engaged = engagedEvents(inYear);

  const signedIds = new Set(engaged.map((e) => e.id));
  const signedPayments = paymentsForEvents(payments, signedIds);
  const paid = signedPayments
    .filter((p) => p.statut === "paye")
    .reduce((s, p) => s + Number(p.montant), 0);
  const pending = signedPayments
    .filter((p) => p.statut === "en_attente")
    .reduce((s, p) => s + Number(p.montant), 0);
  const totalDue = paid + pending;

  const monthly: MonthlySlot[] = MOIS_COURTS.map((label, i) => {
    const month = i + 1;
    const monthEvents = inYear.filter((e) => eventMonth(e) === month);
    const monthSplit = splitYearEvents(monthEvents);
    const monthEngaged = engagedEvents(monthEvents);
    return {
      month,
      label,
      confirmedActiveCount: monthSplit.confirmedActive.length,
      closedCount: monthSplit.closed.length,
      bookedRevenue: sumPrice(monthSplit.booked),
      optionCount: monthSplit.option.length,
      engagedCount: monthEngaged.length,
      engagedRevenue: sumPrice(monthEngaged),
      optionRevenue: sumPrice(monthSplit.option),
      confirmedActiveRevenue: sumPrice(monthSplit.confirmedActive),
      closedRevenue: sumPrice(monthSplit.closed),
    };
  });

  return {
    year,
    booked: {
      count: booked.length,
      revenue: sumPrice(booked),
    },
    confirmedActive: {
      count: confirmedActive.length,
      revenue: sumPrice(confirmedActive),
    },
    closed: {
      count: closed.length,
      revenue: sumPrice(closed),
    },
    option: {
      count: option.length,
      revenue: sumPrice(option),
    },
    engaged: {
      count: engaged.length,
      revenue: sumPrice(engaged),
    },
    prospect: {
      count: prospect.length,
      revenue: sumPrice(prospect),
    },
    collections: {
      paid,
      pending,
      rate: totalDue > 0 ? Math.round((paid / totalDue) * 100) : 0,
    },
    monthly,
    vsPreviousYear: null,
  };
}

function buildProjections(
  events: Event[],
  payments: Payment[],
  years: number[],
  currentYear: number,
): YearProjection[] {
  return years.map((year) => {
    const inYear = events.filter((e) => eventYear(e) === year);
    const { confirmedActive, closed, option, prospect, booked } =
      splitYearEvents(inYear);
    const engaged = engagedEvents(inYear);

    const signedIds = new Set(engaged.map((e) => e.id));
    const signedPayments = paymentsForEvents(payments, signedIds);
    const collected = signedPayments
      .filter((p) => p.statut === "paye")
      .reduce((s, p) => s + Number(p.montant), 0);
    const pending = signedPayments
      .filter((p) => p.statut === "en_attente")
      .reduce((s, p) => s + Number(p.montant), 0);

    return {
      year,
      bookedCount: booked.length,
      bookedRevenue: sumPrice(booked),
      confirmedActiveCount: confirmedActive.length,
      closedCount: closed.length,
      closedRevenue: sumPrice(closed),
      optionCount: option.length,
      optionRevenue: sumPrice(option),
      engagedCount: engaged.length,
      engagedRevenue: sumPrice(engaged),
      prospectCount: prospect.length,
      collected,
      pending,
      isCurrent: year === currentYear,
      isFuture: year > currentYear,
    };
  });
}

export function computeDashboardStats(
  events: Event[],
  payments: Payment[],
  selectedYear: number = new Date().getFullYear(),
): DashboardStats {
  const today = startOfToday();
  const currentYear = today.getFullYear();
  const activeEvents = events.filter((e) => !e.cloture_at);

  const pipelineEvents = activeEvents.filter((e) => e.statut === "prospect");
  const signedEvents = activeEvents.filter((e) =>
    SIGNED_EVENT_STATUSES.includes(e.statut),
  );
  const signedIds = new Set(signedEvents.map((e) => e.id));

  const signedPayments = payments.filter((p) => signedIds.has(p.event_id));
  const paid = signedPayments
    .filter((p) => p.statut === "paye")
    .reduce((s, p) => s + Number(p.montant), 0);
  const pending = signedPayments
    .filter((p) => p.statut === "en_attente")
    .reduce((s, p) => s + Number(p.montant), 0);

  const overduePayments = signedPayments.filter((p) => {
    if (p.statut !== "en_attente" || !p.date_echeance) return false;
    const due = new Date(p.date_echeance);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });

  const overdueAmount = overduePayments.reduce(
    (s, p) => s + Number(p.montant),
    0,
  );

  const futureSigned = signedEvents
    .filter((e) => e.date_debut && daysUntil(e.date_debut) >= 0)
    .sort(
      (a, b) =>
        new Date(a.date_debut!).getTime() - new Date(b.date_debut!).getTime(),
    );

  const nextWedding = futureSigned[0]
    ? {
        id: futureSigned[0].id,
        nom: futureSigned[0].nom_des_maries,
        date: futureSigned[0].date_debut!,
        daysUntil: daysUntil(futureSigned[0].date_debut!),
        statut: futureSigned[0].statut,
      }
    : null;

  const byStatus = {
    prospect: events.filter((e) => e.statut === "prospect").length,
    option: events.filter((e) => e.statut === "option").length,
    confirme: events.filter((e) => e.statut === "confirme" && !e.cloture_at)
      .length,
  };

  const closedCount = events.filter((e) => e.cloture_at).length;

  const alerts: DashboardAlert[] = [];

  if (overduePayments.length > 0) {
    const first = overduePayments[0];
    const event = signedEvents.find((e) => e.id === first.event_id);
    alerts.push({
      id: "overdue",
      severity: "warning",
      title: `${overduePayments.length} paiement${overduePayments.length > 1 ? "s" : ""} en retard`,
      description: `${event?.nom_des_maries ?? "Événement"} — relance à prévoir`,
      href: `/evenements/${first.event_id}`,
    });
  }

  const noSchedule = signedEvents.filter(
    (e) => Number(e.prix_total) > 0 && !payments.some((p) => p.event_id === e.id),
  );
  if (noSchedule.length > 0) {
    alerts.push({
      id: "no-schedule",
      severity: "info",
      title: `${noSchedule.length} dossier${noSchedule.length > 1 ? "s" : ""} sans échéancier`,
      description: noSchedule[0].nom_des_maries,
      href: `/evenements/${noSchedule[0].id}`,
    });
  }

  const prospectsNoDate = activeEvents.filter(
    (e) => e.statut === "prospect" && !e.date_debut,
  );
  if (prospectsNoDate.length > 0) {
    alerts.push({
      id: "prospect-no-date",
      severity: "info",
      title: NEUTRAL_COPY.demandesSansDate(prospectsNoDate.length),
      description: prospectsNoDate[0].nom_des_maries,
      href: `/evenements/${prospectsNoDate[0].id}`,
    });
  }

  const totalDue = paid + pending;

  const availableYears = buildAvailableYears(events, currentYear);
  const safeYear = availableYears.includes(selectedYear)
    ? selectedYear
    : currentYear;

  const yearDetail = computeYearDetail(events, payments, safeYear);
  const prevYearDetail = computeYearDetail(events, payments, safeYear - 1);
  if (
    prevYearDetail.booked.count > 0 ||
    prevYearDetail.booked.revenue > 0
  ) {
    yearDetail.vsPreviousYear = {
      revenuePct: pctChange(
        yearDetail.booked.revenue,
        prevYearDetail.booked.revenue,
      ),
      countPct: pctChange(
        yearDetail.booked.count,
        prevYearDetail.booked.count,
      ),
    };
  }

  const projectionStart = currentYear;
  const projectionEnd = Math.max(currentYear + 3, ...availableYears);
  const projectionYears: number[] = [];
  for (let y = projectionStart; y <= projectionEnd; y++) projectionYears.push(y);

  const projections = buildProjections(
    events,
    payments,
    projectionYears,
    currentYear,
  );

  return {
    pipeline: {
      count: pipelineEvents.length,
      value: pipelineEvents.reduce((s, e) => s + Number(e.prix_total), 0),
    },
    signed: {
      count: signedEvents.length,
      value: signedEvents.reduce((s, e) => s + Number(e.prix_total), 0),
    },
    collections: {
      pending,
      paid,
      rate: totalDue > 0 ? Math.round((paid / totalDue) * 100) : 0,
    },
    overdue: {
      count: overduePayments.length,
      amount: overdueAmount,
    },
    nextWedding,
    byStatus,
    closedCount,
    alerts: alerts.slice(0, 4),
    selectedYear: safeYear,
    availableYears,
    yearDetail,
    projections,
  };
}
