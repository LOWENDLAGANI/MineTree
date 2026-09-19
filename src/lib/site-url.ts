/**
 * Canonical public origin of the app.
 *
 * Resolution order (first match wins):
 * 1. NEXT_PUBLIC_SITE_URL  — set this in Vercel env vars (e.g.
 *    https://minetallest-minetree.vercel.app) so preview + production URLs
 *    are deterministic.
 * 2. VERCEL_URL            — auto-provided by Vercel per deployment
 *    (e.g. my-app-git-branch-team.vercel.app).
 * 3. http://localhost:3000 — local development.
 *
 * NOTE: the OAuth/confirm flow uses requestSiteOrigin() instead (headers-based),
 * because emails must redirect back to the exact host the user clicked from —
 * which on Vercel equals the deployment URL this helper resolves anyway.
 */

const FALLBACK = "http://localhost:3000";

function normalize(raw: string): string {
  const value = raw.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return normalize(siteUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return normalize(vercelUrl);

  return FALLBACK;
}

/** Builds an absolute URL for a path on the canonical origin, e.g. /username. */
export function siteUrlPath(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
