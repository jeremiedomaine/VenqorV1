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
    <div className="flex min-h-screen bg-[#0f172a]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0b1220]">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/caution">
            <VenqorLogo className="brightness-0 invert" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Venqor Caution
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href="/caution"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/caution"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Cautions
          </Link>
          <span
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600"
            title="Bientôt — connexion Stripe Connect"
          >
            <Settings className="h-4 w-4 shrink-0 opacity-50" />
            Paramètres Stripe
          </span>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-3 truncate px-1 text-xs font-medium text-slate-500">
            {workspaceName}
          </p>
          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start gap-2 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
