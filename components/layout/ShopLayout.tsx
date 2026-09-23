import { cookies } from "next/headers"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { createClient } from "@/lib/supabase/server"
import { getOrderWhatsAppNumber } from "@/lib/queries/store-profile"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"

interface ShopLayoutProps {
  children: React.ReactNode
  categories?: Array<{ name: string; slug: string }>
}

export async function ShopLayout({ children, categories = [] }: ShopLayoutProps) {
  const supabase = await createClient()
  const whatsappNumber = await getOrderWhatsAppNumber(supabase)
  const cookieStore = await cookies()
  const cartCount = calculateCartTotal(
    parseCart(cookieStore.get(CART_COOKIE)?.value),
  ).itemCount

  return (
    <>
      <Header categories={categories} cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} whatsappNumber={whatsappNumber} />
    </>
  )
}
