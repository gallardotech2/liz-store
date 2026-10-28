import { LiveProductCard } from "@/components/shop/LiveProductCard"
import { cn } from "@/lib/utils"
import type { HotProduct } from "@/lib/hot"

export function LiveProductGrid({
  products,
  whatsappNumber,
  className,
  priorityFirst = false,
}: {
  products: HotProduct[]
  whatsappNumber: string
  className?: string
  priorityFirst?: boolean
}) {
  if (products.length === 0) return null

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {products.map((product, index) => (
        <LiveProductCard
          key={product.productId}
          product={product}
          whatsappNumber={whatsappNumber}
          priority={priorityFirst && index < 2}
        />
      ))}
    </div>
  )
}
