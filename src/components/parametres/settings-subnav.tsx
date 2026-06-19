"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const SETTINGS_NAV_SECTIONS = [
  { id: "apercu", label: "Vue d'ensemble" },
  { id: "objectifs", label: "Objectifs" },
  { id: "facturation", label: "Facturation" },
  { id: "encaissements", label: "Encaissements" },
  { id: "types-evenement", label: "Types" },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function useSettingsSectionSpy() {
  const [activeId, setActiveId] = useState<string>(
    SETTINGS_NAV_SECTIONS[0].id,
  );

  useEffect(() => {
    const sectionEls = SETTINGS_NAV_SECTIONS.map(({ id }) =>
      document.getElementById(id),
    ).filter((el): el is HTMLElement => el !== null);

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SETTINGS_NAV_SECTIONS.some((s) => s.id === hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, []);

  return activeId;
}

function NavLink({
  id,
  label,
  active,
  compact,
}: {
  id: string;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(id)}
      className={cn(
        "text-left transition-colors",
        compact
          ? "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
          : "block w-full rounded-md px-3 py-2 text-sm",
        active
          ? compact
            ? "bg-[#4F46E5]/10 text-[#4F46E5]"
            : "bg-[#4F46E5]/10 font-medium text-[#4F46E5]"
          : compact
            ? "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
      )}
    >
      {label}
    </button>
  );
}

/** Bandeau horizontal sticky (mobile / tablette) */
export function SettingsSubNavBar() {
  const activeId = useSettingsSectionSpy();

  return (
    <nav
      aria-label="Sections des paramètres"
      className="sticky top-0 z-20 -mx-6 mb-6 border-b border-slate-200/80 bg-slate-50/75 px-6 py-2.5 backdrop-blur-md lg:hidden"
    >
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SETTINGS_NAV_SECTIONS.map(({ id, label }) => (
          <NavLink
            key={id}
            id={id}
            label={label}
            active={activeId === id}
            compact
          />
        ))}
      </div>
    </nav>
  );
}

/** Colonne transparente sticky à droite (desktop) */
export function SettingsSubNavRail() {
  const activeId = useSettingsSectionSpy();

  return (
    <nav
      aria-label="Sections des paramètres"
      className="sticky top-8 hidden w-44 shrink-0 lg:block xl:w-48"
    >
      <div className="rounded-xl border border-slate-200/60 bg-white/40 p-2 shadow-sm backdrop-blur-md">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Sur cette page
        </p>
        <ul className="space-y-0.5">
          {SETTINGS_NAV_SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <NavLink id={id} label={label} active={activeId === id} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
