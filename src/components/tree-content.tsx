import Image from "next/image";
import { LinkIcon } from "@/components/link-icon";
import type { ResolvedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export type TreeLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
  is_active: boolean;
};

type TreeContentProps = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  links: TreeLink[];
  theme: ResolvedTheme;
  /** Renders interactive click-tracking anchors; preview uses inert divs. */
  trackClicks?: boolean;
  showInactive?: boolean;
};

export function TreeContent({
  username,
  displayName,
  bio,
  avatarUrl,
  links,
  theme,
  trackClicks = false,
  showInactive = false,
}: TreeContentProps) {
  const visible = showInactive ? links : links.filter((l) => l.is_active);

  return (
    <div
      className="mx-auto flex min-h-full w-full max-w-[560px] flex-col items-center px-5 pb-16 pt-14"
      style={{ color: theme.text, fontFamily: theme.fontFamily }}
    >
      {/* Avatar */}
      <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/60">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName || username}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold"
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            {(displayName || username).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + bio */}
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {displayName || `@${username}`}
      </h1>
      {bio ? (
        <p className="mt-2 max-w-[420px] whitespace-pre-line text-center text-sm opacity-80">
          {bio}
        </p>
      ) : null}

      {/* Links */}
      <div className="mt-8 flex w-full flex-col gap-3">
        {visible.length === 0 ? (
          <p className="mt-6 text-center text-sm opacity-60">
            No links here yet.
          </p>
        ) : (
          visible.map((link) =>
            trackClicks ? (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-link-id={link.id}
                className={treeLinkClass()}
                style={linkSurfaceStyle(theme)}
              >
                <LinkIcon name={link.icon} color={theme.accent} />
                <span className="truncate">{link.title}</span>
              </a>
            ) : (
              <div
                key={link.id}
                className={cn(treeLinkClass(), !link.is_active && "opacity-50")}
                style={linkSurfaceStyle(theme)}
                aria-hidden
              >
                <LinkIcon name={link.icon} color={theme.accent} />
                <span className="truncate">{link.title}</span>
                {!link.is_active ? (
                  <span className="ml-auto text-[10px] uppercase tracking-wide opacity-60">
                    hidden
                  </span>
                ) : null}
              </div>
            ),
          )
        )}
      </div>

      {/* Footer */}
      <a
        href="/"
        className="mt-14 inline-flex items-center gap-1.5 text-xs opacity-50 transition-opacity hover:opacity-90"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        MineTree
      </a>
    </div>
  );
}

function treeLinkClass() {
  return "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold";
}

export function linkSurfaceStyle(theme: ResolvedTheme): React.CSSProperties {
  if (theme.buttonStyle === "solid") {
    return { backgroundColor: theme.accent, color: theme.accentText };
  }
  if (theme.buttonStyle === "soft") {
    return { backgroundColor: theme.surface, color: theme.text };
  }
  return {
    border: `2px solid ${theme.accent}`,
    color: theme.text,
    backgroundColor: "transparent",
  };
}
