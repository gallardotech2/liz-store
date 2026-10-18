import type { NextConfig } from "next"
import os from "os"
import { withSentryConfig } from "@sentry/nextjs"

function getLocalIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces()
  const addresses: string[] = []
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (String(net.family) === "IPv4" && !net.internal) {
        addresses.push(net.address)
      }
    }
  }
  return addresses
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.0.29',
    '10.29.170.130',
    '192.168.0.27',
    ...new Set(getLocalIPv4Addresses()),
  ],
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
