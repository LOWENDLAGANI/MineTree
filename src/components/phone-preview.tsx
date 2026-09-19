"use client";

import { TreeContent } from "@/components/tree-content";
import type { ResolvedTheme } from "@/lib/themes";

export type LinkRow = {
  id: string;
  title: string;
  url: string;
  icon: string;
  position: number;
  is_active: boolean;
  display_mode: "classic" | "featured";
  thumbnail_url: string | null;
  created_at: string;
};

export function PhonePreview({
  username,
  displayName,
  bio,
  avatarUrl,
  links,
  theme,
}: {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  links: LinkRow[];
  theme: ResolvedTheme;
}) {
  return (
    <div className="animate-pop-in mx-auto w-[300px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/30">
      <div
        className="theme-transition h-[520px] overflow-y-auto rounded-xl"
        style={{ background: theme.background }}
      >
        <TreeContent
          username={username}
          displayName={displayName}
          bio={bio}
          avatarUrl={avatarUrl}
          links={links}
          theme={theme}
        />
      </div>
    </div>
  );
}
