import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

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
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
