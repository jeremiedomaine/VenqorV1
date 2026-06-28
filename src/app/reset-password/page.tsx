import Link from "next/link";
import { redirect } from "next/navigation";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/actions/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=session_expired");
  }

  const errorMessage = authErrorMessage(searchParams.error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <VenqorLogo className="mx-auto text-2xl" />
          <CardTitle className="text-xl font-semibold text-slate-900">
            Nouveau mot de passe
          </CardTitle>
          <p className="text-sm text-slate-500">
            Choisissez un mot de passe pour{" "}
            <span className="font-medium text-slate-700">{user.email}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form action={updatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
              <Input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {errorMessage && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full">
              Enregistrer
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
        </CardContent>
      </Card>
    </div>
  );
}
