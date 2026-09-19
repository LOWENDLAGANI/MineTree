import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getMyAnalytics } from "@/lib/analytics";
import { LinkManager, type LinkRow } from "@/components/link-manager";
import { StatCards } from "@/components/stat-cards";
import { CopyUrlButton } from "@/components/copy-url-button";
import { QrButton } from "@/components/qr-button";
import { MobilePreviewButton } from "@/components/mobile-preview-button";
import { resolveTheme } from "@/lib/themes";
import { TreeCard } from "@/components/tree-card";
import { Greeting } from "@/components/greeting";
import {
  createLink,
  updateLink,
  toggleLink,
  deleteLink,
  reorderLinksAction,
  uploadLinkThumbnail,
} from "./actions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, analytics] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getMyAnalytics(),
  ]);

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-edge border-t-brand" />
        <p className="text-sm text-muted">Setting up your tree…</p>
      </div>
    );
  }

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, icon, position, is_active, display_mode, thumbnail_url, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const theme = resolveTheme(profile.theme_config);
  const publicUrl = `https://minetree.app/${profile.username}`;
  const clicksByLink: Record<string, number> = Object.fromEntries(
    analytics.perLink.map((p) => [p.linkId, p.clicks]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 max-sm:pb-28">
      {/* Greeting + share pill */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="animate-fade-in-up">
          <Greeting name={profile.display_name || profile.username} />
        </div>
        <div className="flex animate-fade-in-up items-center gap-2" style={{ animationDelay: "60ms" }}>
          <span className="hidden items-center gap-2 rounded-full border border-edge bg-surface-2 px-3.5 py-2 text-sm text-muted sm:inline-flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-brand">
              <path
                d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            minetree.app/{profile.username}
          </span>
          <CopyUrlButton url={publicUrl} />
          <QrButton url={publicUrl} />
        </div>
      </div>

      {/* Your tree — big branded card */}
      <section className="mb-10 animate-fade-in-up" style={{ animationDelay: "120ms" }} aria-label="Your tree">
        <h2 className="mb-3 text-xl font-bold text-body">Your MineTree</h2>
        <TreeCard
          username={profile.username}
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          publicUrl={publicUrl}
          linkCount={(links ?? []).length}
          themeAccent={theme.accent}
        />
      </section>

      {/* Weekly stats */}
      <section className="mb-10 animate-fade-in-up" style={{ animationDelay: "180ms" }} aria-label="Analytics summary">
        <h2 className="mb-3 text-xl font-bold text-body">In the last week</h2>
        <StatCards
          views7={analytics.views7}
          views30={analytics.views30}
          clicks7={analytics.clicks7}
          clicks30={analytics.clicks30}
        />
      </section>

      {/* Links editor */}
      <section className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <h2 className="mb-3 text-xl font-bold text-body">Links</h2>
        <LinkManager
          initialLinks={(links ?? []) as LinkRow[]}
          clicksByLink={clicksByLink}
          clicksDailyByLink={analytics.perLinkDaily}
          createLinkAction={createLink}
          updateLinkAction={updateLink}
          toggleLinkAction={toggleLink}
          deleteLinkAction={deleteLink}
          reorderAction={reorderLinksAction}
          uploadThumbnailAction={uploadLinkThumbnail}
        />
      </section>

      <MobilePreviewButton />
    </div>
  );
}
