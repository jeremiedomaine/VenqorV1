import { workspaceMonogram } from "@/lib/portal-utils";
import { cn } from "@/lib/utils";

export function PortalLogo({
  nomDomaine,
  logoUrl,
  className,
}: {
  nomDomaine: string;
  logoUrl: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <div className={cn("flex justify-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={nomDomaine}
          className="h-16 max-w-[200px] object-contain md:h-20"
        />
      </div>
    );
  }

  const monogram = workspaceMonogram(nomDomaine);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm md:h-20 md:w-20">
        <span className="font-portal text-2xl font-light tracking-widest text-zinc-800 md:text-3xl">
          {monogram || "·"}
        </span>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-400">
        {nomDomaine}
      </p>
    </div>
  );
}
