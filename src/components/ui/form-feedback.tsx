import { cn } from "@/lib/utils";

export function FormFeedback({
  error,
  success,
  onDismiss,
}: {
  error?: string | null;
  success?: string | null;
  onDismiss?: () => void;
}) {
  if (!error && !success) return null;

  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <p>{error ?? success}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 underline-offset-2 hover:underline"
        >
          Fermer
        </button>
      )}
    </div>
  );
}
