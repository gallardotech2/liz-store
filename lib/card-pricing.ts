import type { HotProductStatus } from "@/lib/hot"

export interface CardProductPricing {
  price: number
  discountPrice: number | null
}

export interface CardLivePricing {
  promoPrice: number
  hasLivePrice: boolean
  stock: number
  status: HotProductStatus
}

export interface ResolvedCardPricing {
  basePrice: number
  displayPrice: number
  crossedPrice: number | null
  discountPercent: number
  hasLivePrice: boolean
  hasNormalDiscount: boolean
  hasDiscount: boolean
}

export function resolveCardPricing(
  product: CardProductPricing,
  live?: CardLivePricing | null,
): ResolvedCardPricing {
  const price = Number(product.price)
  const discountPrice =
    product.discountPrice === null ? null : Number(product.discountPrice)
  const hasNormalDiscount =
    discountPrice !== null &&
    Number.isFinite(price) &&
    Number.isFinite(discountPrice) &&
    price > 0 &&
    discountPrice < price
  const basePrice = hasNormalDiscount ? discountPrice : price
  const livePrice =
    live?.hasLivePrice &&
    Number.isFinite(live.promoPrice) &&
    live.promoPrice >= 0 &&
    live.promoPrice < basePrice
      ? live.promoPrice
      : null
  const hasLivePrice = livePrice !== null
  const displayPrice = hasLivePrice ? livePrice : basePrice
  const crossedPrice = hasLivePrice
    ? basePrice
    : hasNormalDiscount
      ? product.price
      : null
  const discountPercent = hasLivePrice
    ? Math.round(((basePrice - livePrice) / basePrice) * 100)
    : hasNormalDiscount
      ? Math.round(((product.price - discountPrice) / product.price) * 100)
      : 0

  return {
    basePrice,
    displayPrice,
    crossedPrice,
    discountPercent,
    hasLivePrice,
    hasNormalDiscount,
    hasDiscount: hasLivePrice || hasNormalDiscount,
  }
}

export function getCardAvailability(
  live?: Pick<CardLivePricing, "stock" | "status"> | null,
): string | null {
  if (!live) return null
  if (live.status === "sold") return "Vendido"
  if (live.status === "reserved") return "Reservado"
  if (Number(live.stock) <= 0) return "Agotado"
  return null
}
