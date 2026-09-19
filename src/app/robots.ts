import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't index the app shell — only public tree pages matter for SEO.
        disallow: ["/dashboard", "/api", "/auth", "/login", "/signup", "/reset-password", "/forgot-password"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
