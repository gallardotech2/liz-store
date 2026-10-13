import { ShopLayout } from "@/components/layout/ShopLayout"
import { getShopCategoriesMenu } from "@/lib/queries/categories"

export default async function ShopGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categories = await getShopCategoriesMenu()

  return (
    <ShopLayout categories={categories}>
      {children}
    </ShopLayout>
  )
}
