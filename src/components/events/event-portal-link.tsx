"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function EventPortalLink({
  portalToken,
  show,
}: {
  portalToken: string;
  show: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!show) return null;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const portalUrl = `${baseUrl}/portail/${portalToken}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Page couple</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Lien privé pour consulter l&apos;échéancier et déclarer un virement.
          Partagez-le au couple par email ou message.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={portalUrl} className="font-mono text-xs" />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copier
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Ouvrir
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
