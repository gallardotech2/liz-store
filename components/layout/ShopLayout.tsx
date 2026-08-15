import { Header } from "./Header"
import { Footer } from "./Footer"
import { createClient } from "@/lib/supabase/server"
import { getOrderWhatsAppNumber } from "@/lib/queries/store-profile"

interface ShopLayoutProps {
  children: React.ReactNode
  categories?: Array<{ name: string; slug: string }>
}

export async function ShopLayout({ children, categories = [] }: ShopLayoutProps) {
  const supabase = await createClient()
  const whatsappNumber = await getOrderWhatsAppNumber(supabase)

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} whatsappNumber={whatsappNumber} />
    </>
  )
}
