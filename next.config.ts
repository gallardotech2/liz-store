import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.29', '10.29.170.130', '192.168.0.27'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },

    ],
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
}

export default nextConfig
