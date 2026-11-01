import type { Metadata } from "next"
import { ShopLayout } from "@/components/layout/ShopLayout"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ShopLayout>{children}</ShopLayout>
}
