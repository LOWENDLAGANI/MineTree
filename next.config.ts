import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the Vercel powered-by banner.
  poweredByHeader: false,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  experimental: {
    // Avatar uploads go through server actions; the 1MB default silently
    // rejected the 2MB files the UI advertises.
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Controls how much referrer data leaves the site via public pages.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Avoids MIME-type sniffing surprises.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Media/links can't be embedded into opaque origins via permissions.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Analytics beacons and other API responses should never be cached.
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
