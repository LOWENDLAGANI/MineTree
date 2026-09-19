import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
