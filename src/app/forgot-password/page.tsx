import Link from "next/link";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/actions/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  const errorMessage = authErrorMessage(searchParams.error);
  const sent = searchParams.sent === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <VenqorLogo className="mx-auto text-2xl" />
          <CardTitle className="text-xl font-semibold text-slate-900">
            Mot de passe oublié
          </CardTitle>
          <p className="text-sm text-slate-500">
            Saisissez votre email — nous vous enverrons un lien pour choisir un
            nouveau mot de passe.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Si un compte existe avec cette adresse, un email vient de partir.
                Vérifiez aussi vos spams.
              </p>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-[#4F46E5] hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <form action={requestPasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@domaine.fr"
                  />
                </div>
                {errorMessage && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  Envoyer le lien
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                <Link
                  href="/login"
                  className="font-medium text-[#4F46E5] hover:underline"
                >
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
