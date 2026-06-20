import Link from "next/link";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/actions/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export default function LoginPage({
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
            Connexion
          </CardTitle>
          <p className="text-sm text-slate-500">
            Accédez à votre espace gérant
          </p>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
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
              Se connecter
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-medium text-[#4F46E5] hover:underline">
              Créer un espace
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
