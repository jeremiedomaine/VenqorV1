export function WelcomeMessage({ message }: { message: string }) {
  if (!message.trim()) return null;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm md:p-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-400">
        Un mot pour vous
      </p>
      <p className="mx-auto mt-5 max-w-xl whitespace-pre-wrap font-portal text-xl font-light leading-relaxed text-zinc-700 md:text-2xl">
        {message}
      </p>
    </section>
  );
}
