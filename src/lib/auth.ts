import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * For Server Components and server actions: returns the authenticated user or
 * bounces to /login. Use when a route is unusable without a session.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { id: user.id, email: user.email ?? null };
}

/** Same as requireUser but returns null instead of redirecting. */
export async function getUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}
