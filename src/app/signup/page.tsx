import Link from "next/link";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/actions/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = authErrorMessage(searchParams.error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <VenqorLogo className="mx-auto text-2xl" />
          <CardTitle className="text-xl font-semibold text-slate-900">
            Créer votre espace
          </CardTitle>
          <p className="text-sm text-slate-500">
            Accès sur invitation — votre domaine sera créé automatiquement
          </p>
        </CardHeader>
        <CardContent>
          <form action={signUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_code">Code d&apos;invitation</Label>
              <Input
                id="invite_code"
                name="invite_code"
                required
                autoComplete="off"
                placeholder="Code fourni par Venqor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace_name">Nom du domaine / lieu</Label>
              <Input
                id="workspace_name"
                name="workspace_name"
                required
                placeholder="Château des Lauriers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Votre nom</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Marie Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="vous@domaine.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
              />
            </div>
            {errorMessage && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full">
              Créer mon compte
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-[#4F46E5] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
