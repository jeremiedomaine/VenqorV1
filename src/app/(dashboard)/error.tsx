"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        Une erreur est survenue
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Rechargez la page. Si le problème persiste, arrêtez le serveur puis
        lancez{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
          npm run dev:clean
        </code>
        .
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Réessayer
      </Button>
    </div>
  );
}
