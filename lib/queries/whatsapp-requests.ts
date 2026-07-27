import type { SupabaseClient } from "@supabase/supabase-js"
import type { WhatsappRequestStatus } from "@/types/database"

export function getUserRequests(client: SupabaseClient, userId: string, limit = 50) {
  return client
    .from("whatsapp_requests")
    .select("id, reference_code, status, product_name, product_image, product_price, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
}

export function getAllRequests(client: SupabaseClient, limit = 50) {
  return client
    .from("whatsapp_requests")
    .select("id, reference_code, status, product_name, product_image, product_price, notes, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(limit)
}

export function searchRequestByCode(client: SupabaseClient, code: string) {
  return client
    .from("whatsapp_requests")
    .select("id, reference_code, status, product_name, product_image, product_price, notes, created_at, user_id")
    .ilike("reference_code", `%${code}%`)
    .order("created_at", { ascending: false })
    .limit(10)
}

export function updateRequestStatus(client: SupabaseClient, id: number, status: WhatsappRequestStatus) {
  return client
    .from("whatsapp_requests")
    .update({ status })
    .eq("id", id)
    .select("id, reference_code, status")
    .single()
}
