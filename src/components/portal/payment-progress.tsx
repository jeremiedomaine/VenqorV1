import { formatCurrency } from "@/lib/utils";

export function PaymentProgress({
  paid,
  total,
}: {
  paid: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  const remaining = Math.max(total - paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
            Progression
          </p>
          <p className="mt-2 font-portal text-5xl font-light tabular-nums text-zinc-900">
            {percent}
            <span className="text-2xl text-zinc-400">%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Réglé</p>
          <p className="font-portal text-xl font-medium text-zinc-800">
            {formatCurrency(paid)}
          </p>
          {remaining > 0 && (
            <p className="mt-1 text-xs text-zinc-400">
              {formatCurrency(remaining)} restant
            </p>
          )}
        </div>
      </div>

      <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-zinc-900 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent === 100 && (
        <p className="text-center text-sm text-zinc-500">
          Tous les versements ont été enregistrés.
        </p>
      )}
    </div>
  );
}
