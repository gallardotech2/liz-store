import type { SupabaseClient } from "@supabase/supabase-js"

export function getOrders(client: SupabaseClient, userId: string, limit = 20) {
  return client
    .from("orders")
    .select("id, order_number, status, total, is_paid, payment_method, created_at, order_items(id, product_name, quantity, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
}

export function getOrderById(client: SupabaseClient, id: number) {
  return client
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single()
}

export function getOrderByNumber(client: SupabaseClient, orderNumber: string) {
  return client
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .single()
}

export function getAllOrders(client: SupabaseClient, limit = 50) {
  return client
    .from("orders")
    .select("id, order_number, status, subtotal, total, is_paid, payment_method, created_at, delivery_address_text")
    .order("created_at", { ascending: false })
    .limit(limit)
}

export function getOrdersByStatus(client: SupabaseClient, status: string, limit = 50) {
  return client
    .from("orders")
    .select("id, order_number, status, total, is_paid, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit)
}

export function updateOrderStatus(client: SupabaseClient, id: number, status: string) {
  return client
    .from("orders")
    .update({ status, is_paid: status === "paid" ? true : undefined })
    .eq("id", id)
    .select("id, order_number, status")
    .single()
}
