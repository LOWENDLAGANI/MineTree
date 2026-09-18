"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserOrNull, requireUser } from "@/lib/auth";
import { normalizeUrl, isValidUrl, slugifyUsername, USERNAME_RE, RESERVED_USERNAMES } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type ActionResult = { ok: boolean; message?: string };

async function myProfileId(): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!data) redirect("/dashboard/claim");
  return data.id;
}

async function revalidatePublicPage(username: string) {
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Only allow safe CSS gradients built from hex colors — blocks url(), expressions, etc. */
function sanitizeBackground(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  if (value.length > 300) return undefined;
  if (/[<>"';{}\\]/.test(value)) return undefined;
  if (/url\s*\(/i.test(value)) return undefined;
  if (/expression|javascript|behavior|@import/i.test(value)) return undefined;

  if (HEX_COLOR_RE.test(value)) return value;

  if (/^linear-gradient\(/i.test(value) || /^radial-gradient\(/i.test(value)) {
    // Every color-ish token must be a hex color; positions/percentages allowed.
    const tokens = value.replace(/(linear|radial)-gradient\(|\)$/gi, "").split(",");
    const ok = tokens.every((t) => {
      const token = t.trim().toLowerCase();
      if (!token) return false;
      if (/^-?[\d.]+(deg|%|px|turn|grad|rad)$/.test(token)) return true;
      if (/^to\s+(top|bottom|left|right)(\s+(top|bottom|left|right))?$/.test(token)) return true;
      if (/^\d+\s*(deg|grad|rad|turn)$/.test(token)) return true;
      return HEX_COLOR_RE.test(token);
    });
    return ok ? value : undefined;
  }

  return undefined;
}

function sanitizeAccent(raw: string): string | undefined {
  const value = raw.trim();
  return HEX_COLOR_RE.test(value) ? value.toLowerCase() : undefined;
}

// ---------------------------------------------------------------------------
// Links CRUD — all return a result so the UI can show success/error feedback
// ---------------------------------------------------------------------------

export async function createLink(formData: FormData): Promise<ActionResult> {
  const profileId = await myProfileId();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const icon = String(formData.get("icon") ?? "link").slice(0, 32);

  if (!title || !isValidUrl(url)) {
    return { ok: false, message: "Check the title and URL, then try again." };
  }

  // Place new links at the end of the current order.
  const { data: last } = await supabase
    .from("links")
    .select("position")
    .eq("profile_id", profileId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("links").insert({
    profile_id: profileId,
    title,
    url,
    icon,
    position: nextPosition,
    is_active: true,
  });

  if (error) return { ok: false, message: "Couldn't add the link — try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (profile) await revalidatePublicPage(profile.username);
  return { ok: true, message: `“${title}” added to your tree.` };
}

export async function updateLink(formData: FormData): Promise<ActionResult> {
  const profileId = await myProfileId();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const icon = String(formData.get("icon") ?? "link").slice(0, 32);
  const isActive = String(formData.get("is_active") ?? "") === "on" || String(formData.get("is_active") ?? "") === "true";

  if (!id || !title || !isValidUrl(url)) {
    return { ok: false, message: "Check the title and URL, then try again." };
  }

  const { error } = await supabase
    .from("links")
    .update({ title, url, icon, is_active: isActive })
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) return { ok: false, message: "Couldn't save changes — try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (profile) await revalidatePublicPage(profile.username);
  return { ok: true, message: "Changes saved." };
}

export async function toggleLink(formData: FormData): Promise<ActionResult> {
  const profileId = await myProfileId();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) return { ok: false, message: "Missing link id." };

  const { error } = await supabase
    .from("links")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) return { ok: false, message: "Couldn't update visibility — try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (profile) await revalidatePublicPage(profile.username);
  return { ok: true, message: isActive ? "Link is now visible." : "Link hidden from visitors." };
}

export async function deleteLink(formData: FormData): Promise<ActionResult> {
  const profileId = await myProfileId();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing link id." };

  const { error } = await supabase.from("links").delete().eq("id", id).eq("profile_id", profileId);
  if (error) return { ok: false, message: "Couldn't delete the link — try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (profile) await revalidatePublicPage(profile.username);
  return { ok: true, message: "Link deleted." };
}

// ---------------------------------------------------------------------------
// Reorder — one atomic RPC call after each drag event
// ---------------------------------------------------------------------------

export async function reorderLinksAction(linkIds: string[]): Promise<ActionResult> {
  const profileId = await myProfileId();
  const supabase = await createClient();

  if (!Array.isArray(linkIds) || linkIds.length === 0) {
    return { ok: false, message: "Nothing to reorder." };
  }

  const { error } = await supabase.rpc("reorder_links", { p_order: linkIds });
  if (error) {
    console.error("[reorder]", error.message);
    return { ok: false, message: "Reorder didn't save — try dragging again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (profile) await revalidatePublicPage(profile.username);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings — profile fields
// ---------------------------------------------------------------------------

export async function saveProfile(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const display_name = String(formData.get("display_name") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 400);
  const rawUsername = slugifyUsername(String(formData.get("username") ?? ""));
  const rawAvatarUrl = String(formData.get("avatar_url") ?? "").trim();
  // Avatar URLs must be https and come from the storage host — stored in an
  // <Image src>, and Next.js only whitelists *.supabase.co anyway.
  const avatar_url = /^https:\/\/[^/]*supabase\.co\//.test(rawAvatarUrl) ? rawAvatarUrl : null;

  if (rawUsername.length < 3 || !USERNAME_RE.test(rawUsername) || RESERVED_USERNAMES.has(rawUsername)) {
    redirect("/dashboard/settings?error=username");
  }

  // Ensure the slug isn't taken by ANOTHER profile.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", rawUsername)
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    redirect("/dashboard/settings?error=username_taken");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, bio, username: rawUsername, avatar_url })
    .eq("id", user.id);

  if (error) {
    console.error("[saveProfile]", error.message);
    redirect("/dashboard/settings?error=save");
  }

  revalidatePath(`/${rawUsername}`);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

// ---------------------------------------------------------------------------
// Settings — theme
// ---------------------------------------------------------------------------

export async function saveTheme(theme: {
  preset?: string;
  accent?: string;
  background?: string;
  buttonStyle?: string;
  font?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getUserOrNull();
  if (!user) return { ok: false, message: "You're signed out — log in again." };

  const clean = {
    preset: typeof theme.preset === "string" ? theme.preset.slice(0, 32) : undefined,
    accent: typeof theme.accent === "string" ? sanitizeAccent(theme.accent) : undefined,
    background: typeof theme.background === "string" ? sanitizeBackground(theme.background) : undefined,
    buttonStyle: ["solid", "outline", "soft"].includes(theme.buttonStyle ?? "")
      ? theme.buttonStyle
      : undefined,
    font: ["sans", "serif", "mono"].includes(theme.font ?? "") ? theme.font : undefined,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ theme_config: clean })
    .eq("id", user.id);

  if (error) return { ok: false, message: "Couldn't save your theme — try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile) revalidatePath(`/${profile.username}`);

  return { ok: true, message: "Theme saved." };
}

// ---------------------------------------------------------------------------
// Avatar upload → Supabase Storage (path: avatars/<uid>/avatar.<ext>)
// ---------------------------------------------------------------------------

const ALLOWED_AVATAR_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadAvatar(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard/settings?error=file");
  }
  if (file.size > 2 * 1024 * 1024) {
    redirect("/dashboard/settings?error=toobig");
  }
  // Defense in depth: verify the declared MIME type too, not just the extension.
  if (!ALLOWED_AVATAR_MIME.has(file.type)) {
    redirect("/dashboard/settings?error=type");
  }
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    redirect("/dashboard/settings?error=type");
  }

  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upErr) {
    console.error("[uploadAvatar]", upErr.message);
    redirect("/dashboard/settings?error=upload");
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile) revalidatePath(`/${profile.username}`);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

// ---------------------------------------------------------------------------
// Onboarding: claim username after signup
// ---------------------------------------------------------------------------

export async function claimUsername(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const raw = slugifyUsername(String(formData.get("username") ?? ""));
  if (raw.length < 3 || !USERNAME_RE.test(raw) || RESERVED_USERNAMES.has(raw)) {
    redirect("/dashboard/claim?error=username");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", raw)
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    redirect("/dashboard/claim?error=taken");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: raw })
    .eq("id", user.id);

  if (error) redirect("/dashboard/claim?error=save");

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Analytics ping from the dashboard preview ("views on my page")
// ---------------------------------------------------------------------------

export async function recordOwnPageView() {
  const user = await getUserOrNull();
  if (!user) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!data) return;

  await supabase.from("analytics_events").insert({
    profile_id: data.id,
    event_type: "page_view",
  });
}
