import type { SupabaseClient } from "@supabase/supabase-js"
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "./cart"

export interface CheckoutFormData {
  name: string
  phone: string
  deliveryMethod: "pickup" | "home"
  deliveryLatitude: string
  deliveryLongitude: string
  deliveryAddressText: string
  deliveryReference: string
  pickupLocation: string
  paymentMethod: "escudo" | "direct"
  notes: string
}

export interface CheckoutTotals {
  subtotal: number
  shipping: number
  total: number
}

export interface CreateOrderInput {
  userId: string | null
  sessionKey: string | null
  items: Array<{
    productId: number | null
    productName: string
    productSku: string
    productImage: string
    quantity: number
    price: number
    subtotal: number
  }>
  totals: CheckoutTotals
  delivery: {
    name: string
    phone: string
    deliveryMethod: "pickup" | "home"
    address: string
    reference: string
  }
  deliveryLatitude: number | null
  deliveryLongitude: number | null
  deliveryAddressText: string
  deliveryReference: string
  paymentMethod: string
  notes: string
}

const PHONE_RE = /^\d{7,15}$/

export function validateCheckoutData(
  data: CheckoutFormData,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.name?.trim()) {
    errors.name = "Ingresa tu nombre"
  } else if (data.name.trim().length > 100) {
    errors.name = "El nombre es demasiado largo"
  }

  if (!data.phone?.trim()) {
    errors.phone = "Ingresa tu número de teléfono"
  } else if (!PHONE_RE.test(data.phone.trim())) {
    errors.phone = "El teléfono debe tener entre 7 y 15 dígitos"
  }

  if (data.deliveryMethod !== "pickup" && data.deliveryMethod !== "home") {
    errors.deliveryMethod = "Método de envío no válido"
  }

  if (data.paymentMethod !== "escudo" && data.paymentMethod !== "direct") {
    errors.paymentMethod = "Método de pago no válido"
  }

  if (data.deliveryMethod === "home") {
    if (!data.deliveryLatitude || !data.deliveryLongitude) {
      errors.location = "Selecciona tu ubicación en el mapa"
    } else {
      const lat = Number(data.deliveryLatitude)
      const lng = Number(data.deliveryLongitude)
      if (isNaN(lat) || isNaN(lng) || lat < -22 || lat > -9 || lng < -70 || lng > -57) {
        errors.location = "Ubicación no válida"
      }
    }
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "Las notas son demasiado largas (máximo 500 caracteres)"
  }

  return errors
}

export function calculateTotals(
  subtotal: number,
  deliveryMethod: "pickup" | "home",
): CheckoutTotals {
  const shipping =
    deliveryMethod === "pickup"
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_COST

  return {
    subtotal: round(subtotal),
    shipping,
    total: round(subtotal + shipping),
  }
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `LZ-${ts}-${rand}`
}

export async function createOrder(
  supabase: SupabaseClient,
  input: CreateOrderInput,
) {
  const orderNumber = generateOrderNumber()

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      session_key: input.sessionKey,
      order_number: orderNumber,
      status: "pending",
      subtotal: input.totals.subtotal,
      shipping_cost: input.totals.shipping,
      discount: 0,
      total: input.totals.total,
      shipping_address: input.delivery,
      notes: input.notes,
      is_paid: false,
      payment_method: input.paymentMethod,
      delivery_latitude: input.deliveryLatitude,
      delivery_longitude: input.deliveryLongitude,
      delivery_address_text: input.deliveryAddressText,
      delivery_reference: input.deliveryReference,
    })
    .select("id, order_number")
    .single()

  if (orderError) throw orderError
  if (!order) throw new Error("No se pudo crear el pedido")

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    product_sku: item.productSku,
    product_image: item.productImage,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  }))

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)

  if (itemsError) throw itemsError

  return { id: order.id, orderNumber: order.order_number }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
