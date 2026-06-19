"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans antialiased">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Venqor — erreur inattendue
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Le cache de développement est peut-être corrompu. Dans le terminal :
          </p>
          <pre className="mt-4 rounded-md bg-slate-100 p-3 text-left text-xs text-slate-700">
            npm run dev:clean
          </pre>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA]"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
