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

export function validateCheckoutData(
  data: CheckoutFormData,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.name?.trim()) {
    errors.name = "Ingresa tu nombre"
  }

  if (data.deliveryMethod === "home") {
    if (!data.deliveryLatitude || !data.deliveryLongitude) {
      errors.location = "Selecciona tu ubicación en el mapa"
    }
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
