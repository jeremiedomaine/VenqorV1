"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  LayoutGrid,
  LogOut,
  Settings,
  Zap,
} from "lucide-react";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Pipeline", icon: LayoutGrid, match: "exact" as const },
  {
    href: "/pilotage",
    label: "Pilotage",
    icon: BarChart3,
    match: "prefix" as const,
  },
  {
    href: "/evenements",
    label: "Événements",
    icon: Calendar,
    match: "prefix" as const,
  },
  {
    href: "/automatisations",
    label: "Automatisations",
    icon: Zap,
    match: "prefix" as const,
  },
  {
    href: "/parametres",
    label: "Paramètres",
    icon: Settings,
    match: "prefix" as const,
  },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/">
          <VenqorLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, href, match);
          return (
            <Link
              key={href}
              href={href}
              prefetch
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
  );
}
