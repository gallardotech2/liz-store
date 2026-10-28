import { cookies } from "next/headers"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { BottomNav } from "./BottomNav"
import { createClient } from "@/lib/supabase/server"
import { getOrderWhatsAppNumber } from "@/lib/queries/store-profile"
import { getWhatsappGroupLink } from "@/lib/queries/social-links"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"
import { getActiveHotCampaign } from "@/lib/live"
import { getPublicLiveTitle } from "@/lib/live-copy"
import { HotModeSync } from "@/components/shop/HotModeSync"

interface ShopLayoutProps {
  children: React.ReactNode
  categories?: Array<{ name: string; slug: string }>
}

export async function ShopLayout({ children, categories = [] }: ShopLayoutProps) {
  const supabase = await createClient()
  const [whatsappNumber, whatsappGroupUrl, hot] = await Promise.all([
    getOrderWhatsAppNumber(supabase),
    getWhatsappGroupLink(supabase),
    getActiveHotCampaign(),
  ])
  const cookieStore = await cookies()
  const cartCount = calculateCartTotal(
    parseCart(cookieStore.get(CART_COOKIE)?.value),
  ).itemCount

  const hotInfo = hot
    ? { title: getPublicLiveTitle(hot.session.title), endsAt: hot.session.endsAt }
    : null

  return (
    <>
      <HotModeSync endsAt={hot?.session.endsAt ?? null} />
      <Header
        categories={categories}
        cartCount={cartCount}
        activeLive={hotInfo}
      />
      <main className="flex-1">{children}</main>
      <Footer
        categories={categories}
        whatsappNumber={whatsappNumber}
        whatsappGroupUrl={whatsappGroupUrl}
        hot={hotInfo}
      />
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden="true" />
      <BottomNav cartCount={cartCount} hotActive={!!hot} />
    </>
  )
}
