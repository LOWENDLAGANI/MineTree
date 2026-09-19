import Image from "next/image";
import { LinkIcon } from "@/components/link-icon";
import { CORNER_RADII, AVATAR_RADII, type ResolvedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export type TreeLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
  is_active: boolean;
  display_mode?: "classic" | "featured";
  thumbnail_url?: string | null;
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
      {/* Avatar — shape is user-configurable */}
      <div
        className="relative h-24 w-24 shrink-0 overflow-hidden ring-2 ring-white/60"
        style={{ borderRadius: AVATAR_RADII[theme.avatarShape] }}
      >
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
      <div className="mt-8 flex w-full flex-col gap-3 max-sm:gap-3.5">
        {visible.length === 0 ? (
          <p className="mt-6 text-center text-sm opacity-60">
            No links here yet.
          </p>
        ) : (
          visible.map((link) =>
            link.display_mode === "featured" && trackClicks ? (
              /* Featured: big image card, Linktree-style */
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-link-id={link.id}
                className="featured-card group block w-full overflow-hidden"
                style={{
                  borderRadius: `calc(${CORNER_RADII[theme.cornerStyle]} + 0.25rem)`,
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.accent}33`,
                }}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/5">
                  {link.thumbnail_url ? (
                    <Image
                      src={link.thumbnail_url}
                      alt={link.title}
                      fill
                      sizes="(max-width: 560px) 100vw, 560px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}55)` }}
                    >
                      <LinkIcon name={link.icon} color={theme.accent} className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="truncate text-sm font-bold">{link.title}</span>
                  <svg
                    className="shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </a>
            ) : link.display_mode === "featured" ? (
              /* Preview (inert) variant of the featured card */
              <div
                key={link.id}
                className="featured-card group block w-full overflow-hidden opacity-60"
                style={{
                  borderRadius: `calc(${CORNER_RADII[theme.cornerStyle]} + 0.25rem)`,
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.accent}33`,
                }}
                aria-hidden
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/5">
                  {link.thumbnail_url ? (
                    <Image
                      src={link.thumbnail_url}
                      alt=""
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}55)` }}
                    >
                      <LinkIcon name={link.icon} color={theme.accent} className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 text-center text-xs font-bold">{link.title}</div>
              </div>
            ) : trackClicks ? (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-link-id={link.id}
                className={treeLinkClass()}
                style={{ ...linkSurfaceStyle(theme), borderRadius: CORNER_RADII[theme.cornerStyle] }}
              >
                <LinkIcon name={link.icon} color={theme.accent} />
                <span className="truncate">{link.title}</span>
                {/* Mobile affordance: chevron suggests the row is tappable */}
                <svg
                  className="ml-auto shrink-0 opacity-50"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : (
              <div
                key={link.id}
                className={cn(treeLinkClass(), !link.is_active && "opacity-50")}
                style={{ ...linkSurfaceStyle(theme), borderRadius: CORNER_RADII[theme.cornerStyle] }}
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

      {/* Footer — hideable by the creator */}
      {theme.hideBranding ? null : (
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
      )}
    </div>
  );
}

function treeLinkClass() {
  // min-h touch target ≥44px for mobile; rounded-xl is the fallback that the
  // inline borderRadius style overrides per theme.
  return "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold min-h-[44px] transition-transform active:scale-[0.98]";
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
