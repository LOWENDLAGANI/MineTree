import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getMyAnalytics } from "@/lib/analytics";
import { PhonePreview } from "@/components/phone-preview";
import { LinkManager, type LinkRow } from "@/components/link-manager";
import { StatCards } from "@/components/stat-cards";
import { CopyUrlButton } from "@/components/copy-url-button";
import { resolveTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import {
  createLink,
  updateLink,
  toggleLink,
  deleteLink,
  reorderLinksAction,
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
    // Trigger bootstrap if the DB trigger has not fired yet (edge case).
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
        <p className="text-sm text-zinc-400">Setting up your tree…</p>
      </main>
    );
  }

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, icon, position, is_active, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const theme = resolveTheme(profile.theme_config);
  const publicUrl = `https://minetree.app/${profile.username}`;
  const activeCount = (links ?? []).filter((l) => l.is_active).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold">Your tree</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span>
              minetree.app/
              <Link
                href={`/${profile.username}`}
                target="_blank"
                className="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
              >
                {profile.username}
              </Link>
            </span>
            <CopyUrlButton url={publicUrl} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {activeCount} live link{activeCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <Link href="/dashboard/settings" className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <Button variant="outline" size="sm" className="transition-transform active:scale-95">
            Customize
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <section className="mb-8" aria-label="Analytics summary">
        <StatCards
          views7={analytics.views7}
          views30={analytics.views30}
          clicks7={analytics.clicks7}
          clicks30={analytics.clicks30}
        />
      </section>

      {/* Editor + preview */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Links
          </h2>
          <LinkManager
            initialLinks={(links ?? []) as LinkRow[]}
            createLinkAction={createLink}
            updateLinkAction={updateLink}
            toggleLinkAction={toggleLink}
            deleteLinkAction={deleteLink}
            reorderAction={reorderLinksAction}
          />
        </section>

        <aside
          className="animate-fade-in-up self-start lg:sticky lg:top-20"
          style={{ animationDelay: "220ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Live preview
          </h2>
          <PhonePreview
            username={profile.username}
            displayName={profile.display_name}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            links={(links ?? []) as LinkRow[]}
            theme={theme}
          />
        </aside>
      </div>
    </main>
  );
}
