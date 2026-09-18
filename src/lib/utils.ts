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
