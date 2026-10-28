import Image from "next/image"
import Link from "next/link"
import { ProductCardAction } from "@/components/shop/ProductCardAction"
import {
  getCardAvailability,
  resolveCardPricing,
} from "@/lib/card-pricing"
import { cn, formatCurrency } from "@/lib/utils"
import type { HotProduct } from "@/lib/hot"

export function LiveProductCard({
  product,
  whatsappNumber,
  priority = false,
  className,
}: {
  product: HotProduct
  whatsappNumber: string
  priority?: boolean
  className?: string
}) {
  const soldOut = product.stock <= 0
  const unavailableLabel = getCardAvailability(product)
  const statusLabel =
    unavailableLabel ??
    (product.isFeatured
      ? "Destacado"
      : product.shownAt
        ? "Mostrado"
        : "Disponible")
  const pricing = resolveCardPricing(
    {
      price: product.listPrice,
      discountPrice: product.hasNormalDiscount ? product.normalPrice : null,
    },
    {
      promoPrice: product.promoPrice,
      hasLivePrice: product.hasLivePrice,
      stock: product.stock,
      status: product.status,
    },
  )

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-[rgba(255,142,159,0.18)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FB8496] hover:shadow-[0_10px_30px_rgba(255,142,159,0.16)] dark:border-white/10 dark:bg-surface-raised",
        className,
      )}
    >
      <Link
        href={`/productos/${product.slug}`}
        className="flex flex-1 flex-col no-underline"
      >
        <div className="relative aspect-square overflow-hidden bg-[#FFFBF9] dark:bg-surface">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FB8496] to-[#FDF8F6] text-[#B76E79] dark:to-surface">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.4px]",
                unavailableLabel
                  ? "bg-[#6B6B6B] text-white"
                  : product.isFeatured
                    ? "bg-[#C9A96E] text-white"
                    : product.shownAt
                      ? "border border-[#E74C3C]/25 bg-[#FFF5F5] text-[#C0392B]"
                      : "border border-[#27AE60]/20 bg-[#F0FFF5] text-[#1E8449]",
              )}
            >
              {statusLabel}
            </span>
            {product.isNew && (
              <span className="rounded-full bg-[#C9A96E] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.4px] text-white">
                Nuevo
              </span>
            )}
          </div>

          {pricing.discountPercent > 0 && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-[#E74C3C] px-2 py-0.5 text-[10px] font-bold text-white">
              -{pricing.discountPercent}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          {product.category.name && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.8px] text-primary-dark dark:text-primary">
              {product.category.name}
            </p>
          )}
          <h3 className="mt-1 line-clamp-2 min-h-[2.7em] text-[13px] font-semibold leading-[1.35] text-[#2D2D2D] transition-colors group-hover:text-primary-dark dark:text-ink-strong">
            {product.name}
          </h3>

          <div className="mt-auto pt-2">
            <div className="flex flex-nowrap items-baseline gap-x-1 sm:gap-x-1.5">
              <span
                className={
                  pricing.hasLivePrice
                    ? "whitespace-nowrap text-base font-bold text-[#E74C3C] sm:text-lg"
                    : "whitespace-nowrap text-base font-bold text-primary-dark sm:text-lg dark:text-primary"
                }
              >
                {formatCurrency(pricing.displayPrice)}
              </span>
              {pricing.crossedPrice !== null && (
                <span className="whitespace-nowrap text-[10px] text-[#9CA3B8] line-through sm:text-[11px]">
                  {formatCurrency(pricing.crossedPrice)}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
              <span className="font-semibold text-[#B76E79] dark:text-primary">
                {pricing.hasLivePrice || pricing.hasNormalDiscount
                  ? `Ahorras ${pricing.discountPercent}%`
                  : "Precio regular"}
              </span>
              <span className={soldOut ? "text-[#E74C3C]" : "text-[#6B6B6B]"}>
                {soldOut ? "Sin stock" : `Stock ${product.stock}`}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <ProductCardAction
          productId={product.productId}
          productName={product.name}
          productImage={product.image ?? ""}
          productPrice={pricing.displayPrice}
          whatsappNumber={whatsappNumber}
          unavailableLabel={unavailableLabel}
        />
      </div>
    </article>
  )
}
