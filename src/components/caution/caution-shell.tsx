"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogOut, Settings, ShieldCheck } from "lucide-react";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/caution", label: "Séjours", icon: CalendarDays, match: "exact" as const },
  {
    href: "/caution/parametres",
    label: "Paramètres",
    icon: Settings,
    match: "prefix" as const,
  },
];

export function CautionShell({
  workspaceName,
  children,
}: {
  workspaceName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/caution">
            <VenqorLogo />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#4F46E5]" />
            <p className="text-xs font-medium text-[#4F46E5]">
              Caution & états des lieux
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active =
              match === "exact"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <p className="mb-3 truncate px-1 text-xs font-medium text-slate-500">
            {workspaceName}
          </p>
          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start gap-2 text-slate-600"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
