import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveProfile, uploadAvatar } from "../actions";
import { ThemeEditor } from "@/components/theme-editor";
import { StatusBanner } from "@/components/status-banner";
import { resolveTheme } from "@/lib/themes";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const siteHost = new URL(getSiteUrl()).host;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <p className="text-muted">Profile loading…</p>
      </main>
    );
  }

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, icon, position, is_active, display_mode, thumbnail_url, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .limit(4);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">
          Your public page:{" "}
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="font-medium text-brand-strong hover:underline"
          >
            {siteHost}/{profile.username}
          </Link>
        </p>
      </div>

      {saved || error ? <StatusBanner saved={saved} error={error} /> : null}

      {/* Profile section */}
      <section className="rounded-lg border border-edge bg-surface p-6">
        <h2 className="text-lg font-semibold text-body">Profile</h2>

        <form action={saveProfile} className="mt-4 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-surface-2">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-faint">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar">Avatar (≤ 2 MB)</Label>
              <input
                id="avatar"
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-body hover:file:bg-edge"
              
              />
              <button
                type="submit"
                formAction={uploadAvatar}
                className="mt-2 rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-semibold text-body hover:bg-edge"
              
              >
                Upload avatar
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile.display_name}
                maxLength={80}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="username">Username (your page URL)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="whitespace-nowrap text-sm text-muted">
                  {siteHost}/
                </span>
                <Input
                  id="username"
                  name="username"
                  defaultValue={profile.username}
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-z0-9][a-z0-9-]*"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio}
              maxLength={400}
              rows={3}
              placeholder="Tell visitors who you are…"
              className="mt-1.5"
            />
          </div>

          <Button type="submit">Save profile</Button>
        </form>
      </section>

      {/* Theme section */}
      <section className="rounded-lg border border-edge bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-body">Appearance</h2>
        <ThemeEditor
          initial={(profile.theme_config ?? {}) as Record<string, string>}
          initialPreviewProps={{
            username: profile.username,
            displayName: profile.display_name,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            links: links ?? [],
          }}
        />
      </section>
    </main>
  );
}
