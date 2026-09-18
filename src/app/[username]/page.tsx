import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TreeContent, type TreeLink } from "@/components/tree-content";
import { ClickTracker } from "@/components/click-tracker";
import { resolveTheme } from "@/lib/themes";
import { USERNAME_RE } from "@/lib/utils";

// Public page is fully static-cacheable: fast globally, revalidates every
// 60s. Owner edits propagate instantly via revalidatePath in server actions.
export const revalidate = 60;

async function getProfileByUsername(username: string) {
  // Public reads go through the anon-key client so RLS fully applies.
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, theme_config")
    .eq("username", username)
    .single();

  if (error || !profile) return null;

  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("id, title, url, icon, position, is_active, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (linksError) return { profile, links: [] as TreeLink[] };

  return {
    profile,
    links: (links ?? []).filter((l) => l.is_active) as TreeLink[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username).toLowerCase();

  if (!USERNAME_RE.test(decoded)) return { title: "Not found — MineTree" };

  const result = await getProfileByUsername(decoded);

  if (!result) return { title: "Not found — MineTree" };

  const { profile } = result;
  const title = profile.display_name || `@${profile.username}`;
  const description =
    profile.bio ||
    `Find all of @${profile.username}'s links in one place, powered by MineTree.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicTreePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username).toLowerCase();

  if (!USERNAME_RE.test(decoded)) notFound();

  const result = await getProfileByUsername(decoded);

  if (!result) notFound();

  const { profile, links } = result;
  const theme = resolveTheme(profile.theme_config);

  return (
    <div
      className="min-h-dvh w-full"
      style={{ background: theme.background }}
    >
      <ClickTracker username={profile.username} />
      <TreeContent
        username={profile.username}
        displayName={profile.display_name}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        links={links}
        theme={theme}
        trackClicks
      />
    </div>
  );
}
