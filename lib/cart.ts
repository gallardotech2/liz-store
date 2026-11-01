import { createHmac, timingSafeEqual } from "crypto"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
}

export interface CartData {
  [productId: string]: CartItem
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  itemCount: number
  freeShippingRemaining: number
}

export const CART_COOKIE = "liz_cart"
export const CART_MAX_AGE = 60 * 60 * 24 * 30
export const FREE_SHIPPING_THRESHOLD = 599
export const SHIPPING_COST = 89

const CART_VERSION = "v1"
const MIN_SECRET_LENGTH = 32

function getCartSecret(): string | null {
  const secret = process.env.CART_HMAC_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null
  return secret
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

function sanitizeCart(value: unknown): CartData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {}

  const cart: CartData = {}

  for (const [key, rawItem] of Object.entries(value as Record<string, unknown>)) {
    if (rawItem === null || typeof rawItem !== "object" || Array.isArray(rawItem)) continue
    const item = rawItem as Record<string, unknown>
    const id = String(item.id ?? key)
    const name = typeof item.name === "string" ? item.name : ""
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    const image = typeof item.image === "string" ? item.image : ""
    const slug = typeof item.slug === "string" ? item.slug : ""

    if (!id || !name || !Number.isFinite(price) || price < 0) continue
    if (!Number.isInteger(quantity) || quantity <= 0) continue

    cart[id] = { id, name, price, quantity, image, slug }
  }

  return cart
}

export function parseCart(raw: string | null | undefined): CartData {
  if (!raw) return {}

  const secret = getCartSecret()
  if (!secret) return {}

  try {
    const parts = raw.split(".")
    if (parts.length !== 3) return {}

    const [version, encodedPayload, signature] = parts
    if (version !== CART_VERSION || !encodedPayload || !signature) return {}
    if (!/^[0-9a-f]{64}$/i.test(signature)) return {}

    const expectedSignature = signPayload(encodedPayload, secret)
    const signatureBuffer = Buffer.from(signature, "hex")
    const expectedBuffer = Buffer.from(expectedSignature, "hex")

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return {}
    }

    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8")
    return sanitizeCart(JSON.parse(payload))
  } catch {
    return {}
  }
}

export function signCartData(cart: CartData): string {
  const secret = getCartSecret()
  if (!secret) {
    throw new Error("CART_HMAC_SECRET no configurado o demasiado corto (mínimo 32 caracteres)")
  }

  const encodedPayload = Buffer.from(JSON.stringify(cart), "utf8").toString("base64url")
  const signature = signPayload(encodedPayload, secret)
  return `${CART_VERSION}.${encodedPayload}.${signature}`
}

export function addToCart(
  cart: CartData,
  product: {
    id: number | string
    name: string
    price: number
    image: string
    slug: string
    stock: number
  },
  quantity: number,
): CartData {
  const id = String(product.id)
  const qty = Math.min(quantity, product.stock)
  if (qty <= 0) return cart

  const updated = { ...cart }
  if (id in updated) {
    updated[id] = {
      ...updated[id],
      quantity: Math.min(updated[id].quantity + qty, product.stock),
    }
  } else {
    updated[id] = {
      id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.image,
      slug: product.slug,
    }
  }
  return updated
}

export function updateQuantity(
  cart: CartData,
  productId: string,
  quantity: number,
): CartData {
  if (!(productId in cart)) return cart
  const updated = { ...cart }
  if (quantity <= 0) {
    delete updated[productId]
  } else {
    updated[productId] = { ...updated[productId], quantity }
  }
  return updated
}

export function removeFromCart(cart: CartData, productId: string): CartData {
  const updated = { ...cart }
  delete updated[productId]
  return updated
}

export function calculateCartTotal(cart: CartData): CartSummary {
  const items: CartItem[] = Object.values(cart)
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    subtotal: round(subtotal),
    shipping,
    total: round(subtotal + shipping),
    itemCount,
    freeShippingRemaining,
  }
}

export function clearCartCookie(cookieStore: {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean
      secure?: boolean
      sameSite?: "lax" | "strict" | "none"
      maxAge?: number
      path?: string
    },
  ) => void
}) {
  cookieStore.set(CART_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
