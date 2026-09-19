import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUserOrNull } from "@/lib/auth";

export type AnalyticsSummary = {
  views7: number;
  views30: number;
  clicks7: number;
  clicks30: number;
  perLink: { linkId: string; clicks: number }[];
  /** linkId → 30 buckets (oldest → newest), one per day. */
  perLinkDaily: Record<string, number[]>;
};

/** Aggregates the signed-in creator's analytics; RLS scopes all reads. */
export async function getMyAnalytics(): Promise<AnalyticsSummary> {
  const user = await getUserOrNull();
  if (!user) return { views7: 0, views30: 0, clicks7: 0, clicks30: 0, perLink: [], perLinkDaily: {} };

  const supabase = await createClient();
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

  // 30-day window for the daily per-link series; bucket keys are YYYY-MM-DD.
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const dayKeys: string[] = [];
  const daySet = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 864e5));
    dayKeys.push(key);
    daySet.set(key, dayKeys.length - 1);
  }

  const [v7, v30, c7, c30, linkRows] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", since7),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", since30),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "link_click")
      .gte("created_at", since7),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "link_click")
      .gte("created_at", since30),
    supabase
      .from("analytics_events")
      .select("link_id, created_at")
      .eq("event_type", "link_click")
      .gte("created_at", since30)
      .not("link_id", "is", null),
  ]);

  const perLink = new Map<string, number>();
  const daily = new Map<string, number[]>();
  for (const row of linkRows.data ?? []) {
    if (!row.link_id) continue;
    perLink.set(row.link_id, (perLink.get(row.link_id) ?? 0) + 1);

    let series = daily.get(row.link_id);
    if (!series) {
      series = new Array(30).fill(0);
      daily.set(row.link_id, series);
    }
    const idx = daySet.get(dayKey(new Date(row.created_at)));
    if (idx !== undefined) series[idx] += 1;
  }

  const perLinkDaily: Record<string, number[]> = {};
  for (const [linkId, clicks] of perLink) {
    perLinkDaily[linkId] = daily.get(linkId) ?? new Array(30).fill(0);
  }

  return {
    views7: v7.count ?? 0,
    views30: v30.count ?? 0,
    clicks7: c7.count ?? 0,
    clicks30: c30.count ?? 0,
    perLink: [...perLink.entries()].map(([linkId, clicks]) => ({ linkId, clicks })),
    perLinkDaily,
  };
}
