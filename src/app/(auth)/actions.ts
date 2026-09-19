"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site-url";

async function origin() {
  const h = await headers();
  // On Vercel, x-forwarded-host carries the real visitor-facing host
  // (x-forwarded-host wins so preview deployments get their own URL).
  const forwardedHost =
    h.get("x-forwarded-host") ?? h.get("host") ?? new URL(getSiteUrl()).host;
  const proto =
    h.get("x-forwarded-proto") ?? (forwardedHost.includes("localhost") ? "http" : "https");
  return `${proto}://${forwardedHost}`;
}

export async function submitSignup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Triggers the confirmation email flow; lands on /dashboard after verify.
      emailRedirectTo: `${await origin()}/auth/confirm`,
    },
  });

  if (error) {
    redirect("/signup?error=exists");
  }

  // If email confirmation is disabled in Supabase, a session exists now.
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  // Otherwise show a check-your-inbox state.
  redirect("/signup?check=1");
}

export async function submitLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?error=1");

  // Open-redirect fix: only allow relative, internal paths.
  const next = safeInternalPath(String(formData.get("next") ?? "/dashboard"), "/dashboard");
  redirect(next);
}

/**
 * Sends a Supabase recovery email. The link lands on /auth/confirm, which
 * exchanges the code for a session and forwards to /reset-password.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) redirect("/forgot-password?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
  });

  if (error) redirect("/forgot-password?error=failed");

  // Always show the sent state — never reveal whether the email exists.
  redirect("/forgot-password?sent=1");
}

/** Sets a new password. Only works with the session created by the recovery link. */
export async function submitPasswordReset(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) redirect("/reset-password?error=invalid");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=confirm");

  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect("/reset-password?error=failed");

  redirect("/dashboard");
}

/**
 * Starts Google OAuth. Supabase redirects back to /auth/confirm, which
 * exchanges the PKCE code for a session and lands the user on /dashboard.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origin()}/auth/confirm?next=/dashboard`,
    },
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
