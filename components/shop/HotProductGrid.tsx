import { ProductCard } from "@/components/ui/ProductCard"
import { cn } from "@/lib/utils"
import type { HotProduct } from "@/lib/hot"

interface HotProductGridProps {
  products: HotProduct[]
  whatsappNumber: string
  className?: string
}

export function HotProductGrid({
  products,
  whatsappNumber,
  className,
}: HotProductGridProps) {
  if (products.length === 0) return null

  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-md:gap-3.75",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.productId}
          product={{
            id: product.productId,
            name: product.name,
            slug: product.slug,
            price: product.listPrice,
            discountPrice: product.hasNormalDiscount
              ? product.normalPrice
              : null,
            rating: product.rating,
            ratingCount: product.ratingCount,
            isNew: product.isNew,
            isFeatured: product.isFeatured,
            category: product.category,
            image: product.image,
          }}
          liveProduct={product}
          quickOrder
          whatsappNumber={whatsappNumber}
        />
      ))}
    </div>
  )
}
