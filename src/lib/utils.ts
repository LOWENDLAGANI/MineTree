import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return u.hostname.includes(".") && u.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Maps a URL's hostname to one of the LinkIcon names. Checked most-specific
 * first; anything unknown falls back to "link" (or the provided default).
 */
const DOMAIN_ICONS: [RegExp, string][] = [
  [/youtube\.com|youtu\.be$/i, "video"],
  [/open\.spotify\.com|spotify\.com$/i, "music"],
  [/music\.apple\.com$/i, "music"],
  [/soundcloud\.com$/i, "music"],
  [/github\.com$/i, "github"],
  [/x\.com$|twitter\.com$/i, "twitter"],
  [/instagram\.com$/i, "instagram"],
  [/tiktok\.com$/i, "video"],
  [/twitch\.tv$/i, "video"],
  [/linkedin\.com$/i, "linkedin"],
  [/facebook\.com$/i, "globe"],
  [/calendar|calendly\.com$/i, "calendly"],
  [/buymeacoffee\.com|ko-fi\.com|patreon\.com$/i, "tip_jar"],
  [/mail(?:to)?:|gmail\.com|outlook\.com$/i, "mail"],
  [/maps\.google|goo\.gl\/maps|maps\.app$/i, "map_pin"],
  [/shop|store|etsy\.com|amazon\./i, "cart"],
  [/substack\.com|medium\.com|blog/i, "doc"],
  [/t\.me|telegram/i, "phone"],
];

/** Best-effort icon guess from a URL — never throws. */
export function detectIconForUrl(raw: string): string {
  try {
    const u = new URL(normalizeUrl(raw));
    const host = u.hostname.replace(/^www\./, "");
    for (const [re, icon] of DOMAIN_ICONS) {
      if (re.test(host)) return icon;
    }
    return "link";
  } catch {
    return "link";
  }
}

/** 3–24 chars: lowercase letters, numbers, hyphens. Must start/end alphanumeric. */
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "logout",
  "signup",
  "settings",
  "auth",
  "about",
  "pricing",
  "help",
  "support",
  "terms",
  "privacy",
  "blog",
  "status",
  "supabase",
  "public",
  "static",
  "assets",
  "minetree",
  "tree",
]);

export function slugifyUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}
