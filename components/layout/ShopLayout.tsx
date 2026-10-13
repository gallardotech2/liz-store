import { cookies } from "next/headers"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { BottomNav } from "./BottomNav"
import { getOrderWhatsAppNumberCached } from "@/lib/queries/store-profile"
import { getWhatsappGroupLinkCached } from "@/lib/queries/social-links"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"

interface ShopLayoutProps {
  children: React.ReactNode
  categories?: Array<{ name: string; slug: string }>
}

export async function ShopLayout({ children, categories = [] }: ShopLayoutProps) {
  const whatsappNumber = await getOrderWhatsAppNumberCached()
  const whatsappGroupUrl = await getWhatsappGroupLinkCached()
  const cookieStore = await cookies()
  const cartCount = calculateCartTotal(
    parseCart(cookieStore.get(CART_COOKIE)?.value),
  ).itemCount

  return (
    <>
      <Header categories={categories} cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer
        categories={categories}
        whatsappNumber={whatsappNumber}
        whatsappGroupUrl={whatsappGroupUrl}
      />
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden="true" />
      <BottomNav cartCount={cartCount} />
    </>
  )
}
