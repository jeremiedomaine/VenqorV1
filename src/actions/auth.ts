"use server";

import { redirect } from "next/navigation";
import { signUpErrorCode } from "@/lib/auth-errors";
import { getPostAuthRedirectPath } from "@/lib/venqor-admin";
import { isValidSignupInviteCode } from "@/lib/signup-invite";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData): Promise<void> {
  const supabase = createClient();
  const inviteCode = String(formData.get("invite_code") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const workspaceName = String(formData.get("workspace_name") ?? "").trim();

  if (!isValidSignupInviteCode(inviteCode)) {
    redirect("/signup?error=invite_invalid");
  }

  if (!email || !password || !workspaceName) {
    redirect("/signup?error=signup_failed");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        workspace_name: workspaceName,
      },
    },
  });

  if (error) redirect(`/signup?error=${signUpErrorCode(error.message)}`);
  redirect(getPostAuthRedirectPath(email));
}

export async function signIn(formData: FormData): Promise<void> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) redirect("/login?error=auth");
  redirect(getPostAuthRedirectPath(email));
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function passwordResetRedirectUrl(): string {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${siteUrl}/auth/callback?next=/reset-password`;
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=invalid_email");
  }

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl(),
  });

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData): Promise<void> {
  const supabase = createClient();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (password.length < 6 || password !== passwordConfirm) {
    redirect("/reset-password?error=password_mismatch");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/forgot-password?error=session_expired");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?error=reset_failed");
  }

  redirect(getPostAuthRedirectPath(user.email));
}
