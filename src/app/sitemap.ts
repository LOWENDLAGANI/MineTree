import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { USERNAME_RE } from "@/lib/utils";
import { siteUrlPath } from "@/lib/site-url";

// Regenerate at most once per day; individual tree pages stay fast via ISR.
export const revalidate = 86400;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrlPath("/"), changeFrequency: "monthly", priority: 0.5 },
    { url: siteUrlPath("/login"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrlPath("/signup"), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("username, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !data) return staticEntries;

    const treeEntries: MetadataRoute.Sitemap = data
      .filter((p) => USERNAME_RE.test(p.username))
      .map((p) => ({
        url: siteUrlPath(`/${p.username}`),
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));

    return [...staticEntries, ...treeEntries];
  } catch {
    return staticEntries;
  }
}
