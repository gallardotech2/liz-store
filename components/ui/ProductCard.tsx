import Link from "next/link"
import Image from "next/image"
import { ProductCardAction } from "@/components/shop/ProductCardAction"
import {
  getCardAvailability,
  resolveCardPricing,
  type CardLivePricing,
} from "@/lib/card-pricing"
import { cn, formatCurrency } from "@/lib/utils"

interface ProductCardProduct {
  id: number
  name: string
  slug: string
  price: number
  discountPrice: number | null
  rating: number
  ratingCount: number
  isNew: boolean
  isFeatured: boolean
  category: { name: string; slug: string }
  image: string | null
}

interface ProductCardProps {
  product: ProductCardProduct
  className?: string
  promoPrice?: number | null
  liveProduct?: CardLivePricing | null
  quickOrder?: boolean
  whatsappNumber?: string
}

export function ProductCard({
  product,
  className,
  promoPrice = null,
  liveProduct = null,
  quickOrder = false,
  whatsappNumber,
}: ProductCardProps) {
  const live =
    liveProduct ??
    (promoPrice !== null && Number.isFinite(promoPrice)
      ? {
          promoPrice,
          hasLivePrice: true,
          stock: 1,
          status: "available" as const,
        }
      : null)
  const pricing = resolveCardPricing(product, live)
  const unavailableLabel = getCardAvailability(liveProduct)

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[16px] border border-[rgba(255,142,159,0.05)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-400 hover:-translate-y-1.5 hover:border-[rgb(251,132,150)] hover:shadow-[0_10px_40px_rgba(255,142,159,0.15)] dark:bg-surface-raised dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <Link
        href={`/productos/${product.slug}`}
        className="flex flex-1 flex-col no-underline"
      >
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {liveProduct && pricing.hasLivePrice && (
            <span className="inline-block rounded-full bg-[#E74C3C] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.5px] text-white">
              Live
            </span>
          )}
          {product.isNew && (
            <span className="badge-new inline-block rounded-full bg-[#C9A96E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-white">
              Nuevo
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 translate-x-2.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#4A4A4A] text-base shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 dark:bg-surface-raised dark:text-ink dark:shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#4A4A4A] text-base shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 dark:bg-surface-raised dark:text-ink dark:shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
        </div>

        <div className="relative aspect-square overflow-hidden bg-[#FFFBF9] dark:bg-surface">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6] text-4xl text-[rgb(251,132,150)] dark:to-surface">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col p-5",
            quickOrder && "pb-0",
          )}
        >
          <div
            className={cn(
              "mb-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-primary-dark dark:text-primary",
              quickOrder && "truncate",
            )}
          >
            {product.category.name}
          </div>
          <h3
            className={cn(
              "mb-2 text-base font-sans leading-[1.4] text-[#2D2D2D] transition-colors duration-300 group-hover:text-primary dark:text-ink-strong",
              quickOrder && "line-clamp-2 min-h-[2.8em]",
            )}
          >
            {product.name}
          </h3>
          {product.ratingCount > 0 && (
            <div className="mb-2.5 flex items-center gap-1.5 text-[13px]">
              <span className="tracking-[1px] text-[#F4B740]">
                {"★".repeat(Math.round(product.rating))}
                {"☆".repeat(5 - Math.round(product.rating))}
              </span>
              <span className="text-[#6B6B6B] dark:text-ink-soft">({product.ratingCount})</span>
            </div>
          )}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              quickOrder && "mt-auto pt-2",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-serif text-[22px] font-bold",
                pricing.hasLivePrice
                  ? "text-[#E74C3C]"
                  : "text-primary-dark dark:text-primary",
              )}
            >
              {formatCurrency(pricing.displayPrice)}
            </span>
            {pricing.hasDiscount && pricing.crossedPrice !== null && (
              <>
                <span className="inline-flex items-center gap-0.5 text-base text-[#6B6B6B] line-through dark:text-ink-soft">
                  {formatCurrency(pricing.crossedPrice)}
                </span>
                <span className="rounded bg-[#E74C3C] px-2 py-0.5 text-[12px] font-semibold text-white">
                  -{pricing.discountPercent}%
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {quickOrder && (
        <div className="px-5 pt-4 pb-5">
          <ProductCardAction
            productId={product.id}
            productName={product.name}
            productImage={product.image ?? ""}
            productPrice={pricing.displayPrice}
            whatsappNumber={whatsappNumber}
            unavailableLabel={unavailableLabel}
          />
        </div>
      )}
    </article>
  )
}
