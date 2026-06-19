import { Suspense } from "react";
import {
  PipelineView,
  PipelineViewFallback,
} from "@/components/dashboard/pipeline-view";
import { KpiOverview } from "@/components/dashboard/kpi-overview";
import { NewLeadButton } from "@/components/dashboard/new-lead-button";
import { getBlockedDateSet } from "@/lib/calendar-events";
import { loadArchivedEvents } from "@/lib/load-archived-events";
import { loadDashboardStats } from "@/lib/load-dashboard-stats";
import { loadPendingPaymentNotifications } from "@/lib/load-pending-payment-notifications";
import { loadWorkspaceEventTypes } from "@/lib/load-workspace";

export default async function PipelinePage() {
  const [{ events, stats }, customEventTypes, archivedEvents, paymentNotifications] =
    await Promise.all([
    loadDashboardStats(),
    loadWorkspaceEventTypes(),
    loadArchivedEvents(),
    loadPendingPaymentNotifications(),
  ]);

  const blockedDates = Array.from(getBlockedDateSet(events));

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

      <Suspense
        fallback={
          <PipelineViewFallback
            events={events}
            archivedCount={archivedEvents.length}
          />
        }
      >
        <PipelineView
          events={events}
          archivedEvents={archivedEvents}
          paymentNotifications={paymentNotifications}
        />
      </Suspense>
    </div>
  );
}
