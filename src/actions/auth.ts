"use server";

import { redirect } from "next/navigation";
import { signUpErrorCode } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData): Promise<void> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const workspaceName = String(formData.get("workspace_name") ?? "").trim();

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
  redirect("/");
}

export async function signIn(formData: FormData): Promise<void> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) redirect("/login?error=auth");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
