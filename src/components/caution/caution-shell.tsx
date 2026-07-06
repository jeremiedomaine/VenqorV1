"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

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
          <p className="mt-3 text-xs font-medium text-[#4F46E5]">Venqor Caution</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href="/caution"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/caution"
                ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Cautions
          </Link>
          <Link
            href="/caution/parametres"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/caution/parametres")
                ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Paramètres Stripe
          </Link>
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

      <main className="min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
