export type HotProductStatus = "available" | "requested" | "reserved" | "sold"

export const HOT_PUBLIC_STATUSES: HotProductStatus[] = ["available", "requested"]

export interface HotSessionRow {
  id: number
  title: string
  status: string
  started_at: string | null
  ends_at: string | null
  duration_hours: number | null
  current_product_id: number | null
}

export interface RawHotProduct {
  id: number
  name: string
  slug: string
  price: number | string
  discount_price: number | string | null
  stock: number
  rating: number | string
  rating_count: number
  is_new: boolean
  is_featured: boolean
  is_active: boolean
  category:
    | { name: string; slug: string }
    | Array<{ name: string; slug: string }>
    | null
  product_images?: Array<{ image: string; is_main: boolean }> | null
}

export interface HotProductRow {
  product_id: number
  promo_price: number | string | null
  status: HotProductStatus
  order: number | null
  shown_at: string | null
  products: RawHotProduct | RawHotProduct[] | null
}

export interface HotSession {
  id: number
  title: string
  startedAt: string | null
  endsAt: string | null
  durationHours: number | null
  currentProductId: number | null
}

export interface HotProduct {
  productId: number
  name: string
  slug: string
  image: string | null
  listPrice: number
  normalPrice: number
  hasNormalDiscount: boolean
  promoPrice: number
  hasLivePrice: boolean
  discountPercent: number
  stock: number
  rating: number
  ratingCount: number
  isNew: boolean
  isFeatured: boolean
  category: { name: string; slug: string }
  shownAt: string | null
  status: HotProductStatus
  order: number
  isCurrent: boolean
}

export interface HotCampaign {
  session: HotSession
  products: HotProduct[]
  catalog: HotProduct[]
  current: HotProduct | null
  shown: HotProduct[]
  rest: HotProduct[]
  topDiscounts: HotProduct[]
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return Number.NaN
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function isHotSessionActive(
  session: Pick<HotSessionRow, "status" | "ends_at"> | null | undefined,
  now = Date.now(),
): boolean {
  if (!session || session.status !== "live") return false
  if (!session.ends_at) return true
  return new Date(session.ends_at).getTime() > now
}

export function isHotSessionExpired(
  session: Pick<HotSessionRow, "status" | "ends_at"> | null | undefined,
  now = Date.now(),
): boolean {
  if (!session) return false
  if (session.status !== "live" && session.status !== "paused") return false
  if (!session.ends_at) return false
  return new Date(session.ends_at).getTime() <= now
}

export function mapHotProduct(
  row: HotProductRow,
  currentProductId: number | null,
  options?: { allowMissingPromo?: boolean },
): HotProduct | null {
  const product = getRelation(row.products)
  if (!product || product.is_active === false) return null

  const normalPrice = toNumber(product.discount_price ?? product.price)
  if (!Number.isFinite(normalPrice) || normalPrice <= 0) return null

  const rawListPrice = toNumber(product.price)
  const listPrice =
    Number.isFinite(rawListPrice) && rawListPrice > 0
      ? rawListPrice
      : normalPrice
  const hasNormalDiscount = listPrice > normalPrice

  const rawPromoPrice = toNumber(row.promo_price)
  const hasLivePrice =
    Number.isFinite(rawPromoPrice) &&
    rawPromoPrice >= 0 &&
    rawPromoPrice < normalPrice

  if (!hasLivePrice && !options?.allowMissingPromo) return null

  const promoPrice = hasLivePrice ? rawPromoPrice : normalPrice
  const images = product.product_images ?? []
  const mainImage = images.find((image) => image.is_main) ?? images[0]
  const category = getRelation(product.category)
  const orderValue = row.order === null ? 0 : Number(row.order)

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: mainImage?.image ?? null,
    listPrice,
    normalPrice,
    hasNormalDiscount,
    promoPrice,
    hasLivePrice,
    discountPercent: hasLivePrice
      ? Math.max(
          0,
          Math.round(((normalPrice - promoPrice) / normalPrice) * 100),
        )
      : 0,
    stock: product.stock ?? 0,
    rating: toNumber(product.rating) || 0,
    ratingCount: product.rating_count ?? 0,
    isNew: product.is_new,
    isFeatured: product.is_featured,
    category: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
    },
    shownAt: row.shown_at,
    status: row.status,
    order: Number.isFinite(orderValue) ? orderValue : 0,
    isCurrent: product.id === currentProductId,
  }
}

export function mapHotProducts(
  rows: HotProductRow[],
  currentProductId: number | null,
  options?: { allowMissingPromo?: boolean },
): HotProduct[] {
  return rows
    .map((row) => mapHotProduct(row, currentProductId, options))
    .filter((product): product is HotProduct => product !== null)
    .sort((a, b) => a.order - b.order || a.productId - b.productId)
}

export function buildHotCampaign(
  session: HotSessionRow,
  rows: HotProductRow[],
  options?: { publicOnly?: boolean },
): HotCampaign {
  const catalog = mapHotProducts(rows, session.current_product_id, {
    allowMissingPromo: true,
  })
  const offers = catalog.filter((product) => product.hasLivePrice)
  const products = options?.publicOnly
    ? offers.filter(
        (product) =>
          HOT_PUBLIC_STATUSES.includes(product.status) && product.stock > 0,
      )
    : offers

  const current =
    products.find((product) => product.isCurrent) ?? products[0] ?? null
  const shown = [...products]
    .filter((product) => product.shownAt !== null)
    .sort(
      (a, b) =>
        new Date(b.shownAt!).getTime() - new Date(a.shownAt!).getTime(),
    )
  const rest = products.filter((product) => product.shownAt === null)
  const topDiscounts = [...products].sort(
    (a, b) =>
      b.discountPercent - a.discountPercent ||
      a.order - b.order ||
      a.productId - b.productId,
  )

  return {
    session: {
      id: session.id,
      title: session.title,
      startedAt: session.started_at,
      endsAt: session.ends_at,
      durationHours: session.duration_hours,
      currentProductId: current?.productId ?? session.current_product_id,
    },
    products,
    catalog,
    current,
    shown,
    rest,
    topDiscounts,
  }
}

export function getHotPromoMap(
  campaign: HotCampaign | null,
): Map<number, HotProduct> {
  return new Map(campaign?.products.map((product) => [product.productId, product]) ?? [])
}

export function getHotCatalogMap(
  campaign: HotCampaign | null,
): Map<number, HotProduct> {
  return new Map(
    campaign?.catalog.map((product) => [product.productId, product]) ?? [],
  )
}

export function getHotRemaining(
  endsAt: string | null,
  now = Date.now(),
): number | null {
  if (!endsAt) return null
  return Math.max(0, new Date(endsAt).getTime() - now)
}

export function formatHotRemaining(remaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const clock = [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")

  return days > 0 ? `${days}d ${clock}` : clock
}
