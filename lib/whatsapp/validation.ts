export const MAX_CART_ITEMS = 20
export const MAX_ITEM_QUANTITY = 9999

export interface CheckoutItemInput {
  id: number
  quantity: number
  clientPrice?: number
}

export interface ProductForValidation {
  id: number | string
  name: string
  price: number | string
  discount_price?: number | string | null
  stock: number | string
  product_images?: Array<{ image: string; is_main: boolean }> | null
}

export interface PricedItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  subtotal: number
}

export interface PricedCart {
  items: PricedItem[]
  subtotal: number
  total: number
}

export interface CheckoutContact {
  name: string
  phone: string
  deliveryMethod: "pickup" | "home"
  addressText: string
  reference: string
  notes: string
  paymentMethod: string
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function asObject(raw: unknown): Record<string, unknown> | null {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

export function isHoneypot(raw: unknown): boolean {
  const body = asObject(raw)
  if (!body) return false
  return typeof body.website === "string" && body.website.trim().length > 0
}

export function parseCartItems(raw: unknown): ValidationResult<CheckoutItemInput[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "El carrito está vacío", code: "EMPTY_CART" }
  }

  if (raw.length > MAX_CART_ITEMS) {
    return { ok: false, error: "El carrito tiene demasiados productos", code: "TOO_MANY_ITEMS" }
  }

  const items: CheckoutItemInput[] = []
  const seen = new Set<number>()

  for (const entry of raw) {
    const item = asObject(entry)
    if (!item) {
      return { ok: false, error: "Hay un producto inválido en el carrito", code: "INVALID_ITEM" }
    }

    const id = Number(item.id)
    const quantity = Number(item.quantity)

    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, error: "Hay un producto inválido en el carrito", code: "INVALID_ITEM" }
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return { ok: false, error: "La cantidad de un producto no es válida", code: "INVALID_QUANTITY" }
    }

    if (seen.has(id)) {
      return { ok: false, error: "Hay productos duplicados en el carrito", code: "DUPLICATE_ITEM" }
    }
    seen.add(id)

    const clientPrice = Number(item.price)
    items.push({
      id,
      quantity,
      clientPrice: Number.isFinite(clientPrice) && clientPrice >= 0 ? clientPrice : undefined,
    })
  }

  return { ok: true, data: items }
}

export function parseContact(raw: unknown): ValidationResult<CheckoutContact> {
  const body = asObject(raw)
  if (!body) {
    return { ok: false, error: "Datos de contacto inválidos", code: "INVALID_CONTACT" }
  }

  const name = cleanString(body.name, 100)
  if (name.length < 2) {
    return { ok: false, error: "Ingresa tu nombre", code: "INVALID_NAME" }
  }

  const rawPhone = cleanString(body.phone, 30)
  if (!/^[0-9+\s()-]+$/.test(rawPhone)) {
    return { ok: false, error: "Ingresa un teléfono válido", code: "INVALID_PHONE" }
  }
  const phone = rawPhone.replace(/\D/g, "")
  if (phone.length < 7 || phone.length > 15) {
    return { ok: false, error: "Ingresa un teléfono válido", code: "INVALID_PHONE" }
  }

  const deliveryMethod = body.deliveryMethod
  if (deliveryMethod !== "pickup" && deliveryMethod !== "home") {
    return { ok: false, error: "Selecciona un método de entrega válido", code: "INVALID_DELIVERY" }
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      deliveryMethod,
      addressText: cleanString(body.addressText, 200),
      reference: cleanString(body.reference, 100),
      notes: cleanString(body.notes, 500),
      paymentMethod: cleanString(body.paymentMethod, 50),
    },
  }
}

export function repriceCart(
  requested: CheckoutItemInput[],
  products: ProductForValidation[],
): ValidationResult<PricedCart> {
  const productMap = new Map<number, ProductForValidation>()
  for (const product of products) {
    const id = Number(product.id)
    if (Number.isInteger(id)) productMap.set(id, product)
  }

  const items: PricedItem[] = []

  for (const requestedItem of requested) {
    const product = productMap.get(requestedItem.id)
    if (!product) {
      return { ok: false, error: "Uno de los productos ya no está disponible", code: "PRODUCT_UNAVAILABLE" }
    }

    const stock = Number(product.stock)
    if (!Number.isInteger(stock) || stock < requestedItem.quantity) {
      return {
        ok: false,
        error: `Solo quedan ${Math.max(0, stock || 0)} unidades de ${product.name}`,
        code: "OUT_OF_STOCK",
      }
    }

    const dbPrice = Number(product.discount_price ?? product.price)
    if (!Number.isFinite(dbPrice) || dbPrice < 0) {
      return { ok: false, error: "El precio de un producto no es válido", code: "INVALID_PRICE" }
    }

    if (
      requestedItem.clientPrice !== undefined &&
      Math.abs(roundMoney(requestedItem.clientPrice) - roundMoney(dbPrice)) > 0.009
    ) {
      return {
        ok: false,
        error: `El precio de ${product.name} cambió. Actualiza tu carrito e intenta de nuevo.`,
        code: "PRICE_CHANGED",
      }
    }

    const images = Array.isArray(product.product_images) ? product.product_images : []
    const mainImage = images.find((image) => image.is_main) ?? images[0]
    const quantity = requestedItem.quantity
    const price = roundMoney(dbPrice)

    items.push({
      id: requestedItem.id,
      name: product.name,
      price,
      quantity,
      image: mainImage?.image ?? "",
      subtotal: roundMoney(price * quantity),
    })
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0))

  return {
    ok: true,
    data: {
      items,
      subtotal,
      total: subtotal,
    },
  }
}
