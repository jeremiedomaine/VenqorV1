import {
  PipelineView,
} from "@/components/dashboard/pipeline-view";
import { KpiOverview } from "@/components/dashboard/kpi-overview";
import { NewLeadButton } from "@/components/dashboard/new-lead-button";
import { getBlockedDateSet } from "@/lib/calendar-events";
import {
  loadArchivedEventCount,
  loadArchivedEvents,
} from "@/lib/load-archived-events";
import { loadDashboardStats } from "@/lib/load-dashboard-stats";
import {
  loadPendingPaymentNotificationCount,
  loadPendingPaymentNotifications,
} from "@/lib/load-pending-payment-notifications";
import { loadWorkspaceEventTypes } from "@/lib/load-workspace";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { vue?: string };
}) {
  const view = searchParams.vue;
  const showArchives = view === "archives";
  const showNotifs = view === "notifs";

  const [
    { events, stats },
    customEventTypes,
    archivedEvents,
    archivedCount,
    paymentNotifications,
    notifCount,
  ] = await Promise.all([
    loadDashboardStats(),
    loadWorkspaceEventTypes(),
    showArchives ? loadArchivedEvents() : Promise.resolve([]),
    showArchives ? Promise.resolve(0) : loadArchivedEventCount(),
    showNotifs ? loadPendingPaymentNotifications() : Promise.resolve([]),
    showNotifs ? Promise.resolve(0) : loadPendingPaymentNotificationCount(),
  ]);

  const blockedDates = Array.from(getBlockedDateSet(events));
  const resolvedArchivedCount = showArchives
    ? archivedEvents.length
    : archivedCount;
  const resolvedNotifCount = showNotifs
    ? paymentNotifications.length
    : notifCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos prospects et faites avancer vos dossiers
          </p>
        </div>
        <NewLeadButton
          customEventTypes={customEventTypes}
          blockedDates={blockedDates}
        />
      </div>

      <KpiOverview stats={stats} />

      <PipelineView
        events={events}
        archivedEvents={archivedEvents}
        archivedCount={resolvedArchivedCount}
        paymentNotifications={paymentNotifications}
        notifCount={resolvedNotifCount}
      />
    </div>
  );
}
