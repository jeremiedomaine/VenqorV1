import { capitalizeFirst, formatDateLong, parseCoupleNames } from "@/lib/portal-utils";

export function CoupleHero({
  nomDesMaries,
  dateDebut,
}: {
  nomDesMaries: string;
  dateDebut: string | null;
}) {
  const { first, second } = parseCoupleNames(nomDesMaries);
  const dateFormatted = dateDebut ? capitalizeFirst(formatDateLong(dateDebut) ?? "") : null;

  return (
    <header className="text-center">
      <div className="mx-auto mb-10 h-px w-12 bg-zinc-300" />

      {second ? (
        <h1 className="font-portal text-zinc-900">
          <span className="block text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
            {first}
          </span>
          <span className="my-3 block text-2xl font-light italic text-zinc-400 md:text-3xl">
            &
          </span>
          <span className="block text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
            {second}
          </span>
        </h1>
      ) : (
        <h1 className="font-portal text-5xl font-light tracking-tight text-zinc-900 md:text-6xl lg:text-7xl">
          {first}
        </h1>
      )}

      {dateFormatted && (
        <p className="mt-10 text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">
          {dateFormatted}
        </p>
      )}

      <div className="mx-auto mt-10 h-px w-12 bg-zinc-300" />
    </header>
  );
}
