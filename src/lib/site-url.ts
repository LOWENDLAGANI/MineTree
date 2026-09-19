/**
 * Canonical public origin of the app.
 *
 * Resolution order (first match wins):
 * 1. NEXT_PUBLIC_SITE_URL  — set this in Vercel env vars so preview +
 *    production URLs are deterministic.
 * 2. VERCEL_URL            — auto-provided by Vercel per deployment.
 * 3. Production build      — the deployed domain, hardcoded below.
 * 4. http://localhost:3000 — local development.
 *
 * The username part of public URLs (/username) is appended per user at
 * render time — each user's QR code and share button encode their own page.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

/** Production domain — used when NEXT_PUBLIC_SITE_URL is not configured. */
const PROD_FALLBACK = "https://minetallest-minetree.vercel.app";

function normalize(raw: string): string {
  const value = raw.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return normalize(siteUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return normalize(vercelUrl);

  // Production builds default to the deployed domain; local dev stays localhost.
  return process.env.NODE_ENV === "production" ? PROD_FALLBACK : LOCAL_FALLBACK;
}

/** Builds an absolute URL for a path on the canonical origin, e.g. /username. */
export function siteUrlPath(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
