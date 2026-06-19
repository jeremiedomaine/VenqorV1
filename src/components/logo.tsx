import { cn } from "@/lib/utils";

export function VenqorLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-tight text-xl select-none",
        className,
      )}
    >
      <span className="text-[#4F46E5]">Ven</span>
      <span className="text-[#0F172A]">qor.</span>
    </span>
  );
}
