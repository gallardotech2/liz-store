import { ShopLayout } from "@/components/layout/ShopLayout"
import { createClient } from "@/lib/supabase/server"

export default async function ShopGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("is_active", true)
    .order("order")
    .limit(10)

  return (
    <ShopLayout categories={categories ?? []}>
      {children}
    </ShopLayout>
  )
}
