import { Mail, Phone, User } from "lucide-react";
import type { PortalData } from "@/lib/types";

function ContentBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  if (!content.trim()) return null;

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:p-10">
      <h3 className="mb-5 font-portal text-xl font-medium text-zinc-800">
        {title}
      </h3>
      <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-zinc-600">
        {content}
      </div>
    </article>
  );
}

export function EspaceMariesSections({
  workspace,
}: {
  workspace: PortalData["workspace"];
}) {
  const hasContent =
    workspace.guide_infos_pratiques ||
    workspace.guide_regles ||
    workspace.guide_prestataires ||
    workspace.contact_nom ||
    workspace.contact_email ||
    workspace.contact_telephone;

  if (!hasContent) return null;

  const hasContact =
    workspace.contact_nom ||
    workspace.contact_email ||
    workspace.contact_telephone;

  return (
    <section className="space-y-10">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-400">
          Espace mariés
        </p>
        <h2 className="mt-3 font-portal text-3xl font-light text-zinc-900">
          Tout ce qu&apos;il faut savoir
        </h2>
      </div>

      <div className="space-y-6">
        <ContentBlock
          title="Infos pratiques"
          content={workspace.guide_infos_pratiques}
        />
        <ContentBlock title="Règles du lieu" content={workspace.guide_regles} />
        <ContentBlock
          title="Prestataires recommandés"
          content={workspace.guide_prestataires}
        />

        {hasContact && (
          <article className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:p-10">
            <h3 className="mb-5 font-portal text-xl font-medium text-zinc-800">
              Contact du domaine
            </h3>
            <ul className="space-y-3 text-[15px] text-zinc-600">
              {workspace.contact_nom && (
                <li className="flex items-center gap-3">
                  <User className="h-4 w-4 shrink-0 text-zinc-400" />
                  {workspace.contact_nom}
                </li>
              )}
              {workspace.contact_email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                  <a
                    href={`mailto:${workspace.contact_email}`}
                    className="hover:text-zinc-900"
                  >
                    {workspace.contact_email}
                  </a>
                </li>
              )}
              {workspace.contact_telephone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                  <a
                    href={`tel:${workspace.contact_telephone.replace(/\s/g, "")}`}
                    className="hover:text-zinc-900"
                  >
                    {workspace.contact_telephone}
                  </a>
                </li>
              )}
            </ul>
          </article>
        )}
      </div>
    </section>
  );
}
