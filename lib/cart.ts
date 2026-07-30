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

function getCartSecret(): string {
  const secret = process.env.CART_HMAC_SECRET
  if (!secret) {
    throw new Error("CART_HMAC_SECRET no está configurada")
  }
  return secret
}

function signCart(data: string): string {
  const hmac = createHmac("sha256", getCartSecret())
  hmac.update(data)
  return hmac.digest("hex")
}

export function parseCart(raw: string | null | undefined): CartData {
  if (!raw) return {}
  try {
    const [payload, signature] = raw.split("|")
    if (!payload || !signature) return {}

    const expectedSig = signCart(payload)
    const sigBuffer = Buffer.from(signature, "hex")
    const expectedBuffer = Buffer.from(expectedSig, "hex")

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {}
    }

    return JSON.parse(payload) as CartData
  } catch {
    return {}
  }
}

export function signCartData(cart: CartData): string {
  const payload = JSON.stringify(cart)
  const signature = signCart(payload)
  return `${payload}|${signature}`
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

export function clearCartCookie(cookieStore: any) {
  cookieStore.set(CART_COOKIE, "", { maxAge: 0, path: "/" })
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
