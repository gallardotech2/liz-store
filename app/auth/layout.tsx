import type { Metadata } from "next"
import { BasicLayout } from "@/components/layout/BasicLayout"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BasicLayout>{children}</BasicLayout>
}