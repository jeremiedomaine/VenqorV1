import { getEventCopy, NEUTRAL_COPY } from "@/lib/event-copy";
import {
  portalUnavailableMessage,
  type PortalUnavailableReason,
} from "@/lib/portal-access";

export function PortalUnavailable({
  reason,
  typeEvenement,
}: {
  reason: PortalUnavailableReason;
  typeEvenement?: string;
}) {
  const { title, description } = portalUnavailableMessage(
    reason,
    typeEvenement,
  );
  const portalLabel = typeEvenement
    ? getEventCopy(typeEvenement).portalTitle
    : NEUTRAL_COPY.espaceClient;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
          {portalLabel}
        </p>
        <h1 className="mt-4 font-portal text-2xl font-medium text-zinc-900">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
