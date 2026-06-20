"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Move, Save } from "lucide-react";
import { saveContratSignatureZones } from "@/actions/contrat-signature-zones";
import {
  defaultContratSignatureZones,
  type ContratSignatureZone,
  type ContratSignatureZones,
} from "@/lib/contrat-signature-zones";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";

const DISPLAY_WIDTH = 560;
const SIGNER_LABELS = ["Marié(e) 1", "Marié(e) 2"] as const;
const SIGNER_COLORS = [
  "border-[#4F46E5] bg-[#4F46E5]/15",
  "border-emerald-600 bg-emerald-500/15",
] as const;

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

function pdfToOverlay(
  zone: ContratSignatureZone,
  pageHeight: number,
  scale: number,
) {
  return {
    left: zone.x * scale,
    top: (pageHeight - zone.y - zone.height) * scale,
    width: zone.width * scale,
    height: zone.height * scale,
  };
}

function overlayToPdf(
  left: number,
  top: number,
  zone: ContratSignatureZone,
  pageHeight: number,
  pageWidth: number,
  scale: number,
): ContratSignatureZone {
  const x = Math.round(Math.max(0, Math.min(pageWidth - zone.width, left / scale)));
  const y = Math.round(
    Math.max(
      0,
      Math.min(pageHeight - zone.height, pageHeight - top / scale - zone.height),
    ),
  );
  return { ...zone, x, y };
}

export function ContratSignaturePlacer({
  initialZones,
}: {
  initialZones: ContratSignatureZones | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  const pdfDataRef = useRef<ArrayBuffer | null>(null);
  const dragRef = useRef<{
    signer: 0 | 1;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [zones, setZones] = useState<ContratSignatureZones>(
    initialZones ?? defaultContratSignatureZones(),
  );
  const [pageMode, setPageMode] = useState<"last" | "fixed">(
    initialZones?.signer1.page === "last" ? "last" : "fixed",
  );
  const [fixedPage, setFixedPage] = useState(
    typeof initialZones?.signer1.page === "number"
      ? initialZones.signer1.page
      : 1,
  );
  const [numPages, setNumPages] = useState(1);
  const [previewPage, setPreviewPage] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [scale, setScale] = useState(1);
  const [selectedSigner, setSelectedSigner] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  const applyPageMode = useCallback(
    (nextZones: ContratSignatureZones): ContratSignatureZones => {
      const page = pageMode === "last" ? ("last" as const) : fixedPage;
      return {
        signer1: { ...nextZones.signer1, page },
        signer2: { ...nextZones.signer2, page },
      };
    },
    [fixedPage, pageMode],
  );

  const renderPage = useCallback(
    async (pageNumber: number) => {
      const pdfjs = pdfjsRef.current;
      const pdfData = pdfDataRef.current;
      const canvas = canvasRef.current;
      if (!pdfjs || !pdfData || !canvas) return;

      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const nextScale = DISPLAY_WIDTH / viewport.width;
      const scaledViewport = page.getViewport({ scale: nextScale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      setPageSize({ width: viewport.width, height: viewport.height });
      setScale(nextScale);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setLoadError(null);

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
        pdfjsRef.current = pdfjs;

        const response = await fetch("/api/workspace/contrat-pdf");
        if (!response.ok) {
          throw new Error("Impossible de charger le PDF.");
        }

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        pdfDataRef.current = buffer;
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        const totalPages = pdf.numPages;
        setNumPages(totalPages);

        const initialPreview =
          pageMode === "last"
            ? totalPages
            : Math.min(Math.max(1, fixedPage), totalPages);
        setPreviewPage(initialPreview);
        await renderPage(initialPreview);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Chargement du PDF impossible.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (loading || loadError) return;
    const page =
      pageMode === "last"
        ? numPages
        : Math.min(Math.max(1, fixedPage), numPages);
    setPreviewPage(page);
    void renderPage(page);
  }, [fixedPage, loadError, loading, numPages, pageMode, renderPage]);

  useEffect(() => {
    setZones((current) => applyPageMode(current));
  }, [applyPageMode]);

  function updateSignerZone(signer: 0 | 1, patch: Partial<ContratSignatureZone>) {
    setZones((current) => {
      const key = signer === 0 ? "signer1" : "signer2";
      return applyPageMode({
        ...current,
        [key]: { ...current[key], ...patch },
      });
    });
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    signer: 0 | 1,
  ) {
    event.preventDefault();
    setSelectedSigner(signer);

    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const zone = signer === 0 ? zones.signer1 : zones.signer2;
    const pos = pdfToOverlay(zone, pageSize.height, scale);

    dragRef.current = {
      signer,
      offsetX: event.clientX - rect.left - pos.left,
      offsetY: event.clientY - rect.top - pos.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const overlay = overlayRef.current;
    if (!drag || !overlay) return;

    const rect = overlay.getBoundingClientRect();
    const zone = drag.signer === 0 ? zones.signer1 : zones.signer2;
    const left = event.clientX - rect.left - drag.offsetX;
    const top = event.clientY - rect.top - drag.offsetY;
    const next = overlayToPdf(
      left,
      top,
      zone,
      pageSize.height,
      pageSize.width,
      scale,
    );
    updateSignerZone(drag.signer, { x: next.x, y: next.y });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(null);
    void run(async () => {
      const payload = applyPageMode(zones);
      const result = await saveContratSignatureZones(payload);
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setSaveSuccess("Emplacements enregistrés — utilisés pour les prochains envois.");
    });
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Chargement de l&apos;aperçu PDF…</p>
    );
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Placement des signatures
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Glissez les deux zones sur la page où les mariés doivent signer.
            Les coordonnées sont enregistrées pour votre domaine.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Page des signatures
            </legend>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="page_mode"
                checked={pageMode === "last"}
                onChange={() => setPageMode("last")}
              />
              Dernière page (recommandé)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="page_mode"
                checked={pageMode === "fixed"}
                onChange={() => setPageMode("fixed")}
              />
              Page fixe
            </label>
          </fieldset>

          {pageMode === "fixed" && (
            <div>
              <label
                htmlFor="fixed_page"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Numéro de page
              </label>
              <input
                id="fixed_page"
                type="number"
                min={1}
                max={numPages}
                value={fixedPage}
                onChange={(e) =>
                  setFixedPage(
                    Math.min(numPages, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          )}

          {pageMode === "last" && (
            <p className="text-xs text-slate-500">
              Aperçu : page {previewPage} / {numPages}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SIGNER_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedSigner(index as 0 | 1)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedSigner === index
                  ? index === 0
                    ? "border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]"
                    : "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-3">
        <div
          ref={overlayRef}
          className="relative mx-auto w-fit select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <canvas ref={canvasRef} className="block shadow-sm" />
          {([0, 1] as const).map((signer) => {
            const zone = signer === 0 ? zones.signer1 : zones.signer2;
            const pos = pdfToOverlay(zone, pageSize.height, scale);
            const isSelected = selectedSigner === signer;

            return (
              <div
                key={signer}
                role="button"
                tabIndex={0}
                onPointerDown={(event) => handlePointerDown(event, signer)}
                className={`absolute cursor-grab border-2 active:cursor-grabbing ${SIGNER_COLORS[signer]} ${
                  isSelected ? "ring-2 ring-offset-1 ring-slate-400" : ""
                }`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                }}
              >
                <span className="absolute -top-6 left-0 flex items-center gap-1 text-[11px] font-medium text-slate-700">
                  <Move className="h-3 w-3" />
                  {SIGNER_LABELS[signer]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-emerald-700">{saveSuccess}</p>}

      <Button type="button" disabled={pending} onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" />
        {pending ? "Enregistrement…" : "Enregistrer les emplacements"}
      </Button>
    </div>
  );
}
