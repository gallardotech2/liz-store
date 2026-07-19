import type { SupabaseClient } from "@supabase/supabase-js"

export interface ProductInterestInput {
  sessionId: number
  productId: number
  action: "whatsapp" | "view" | "add_cart" | "checkout"
}

export async function trackInterest(
  supabase: SupabaseClient,
  input: ProductInterestInput,
) {
  const { data, error } = await supabase
    .from("product_interests")
    .insert({
      session_id: input.sessionId,
      product_id: input.productId,
      action: input.action,
    })
    .select("id")
    .single()

  if (error) throw error

  if (
    input.action === "add_cart" ||
    input.action === "checkout"
  ) {
    await supabase.rpc("increment_session_interested", {
      session_id: input.sessionId,
    })
  } else if (input.action === "view") {
    await supabase.rpc("increment_session_shown", {
      session_id: input.sessionId,
    })
  }

  return data
}

export async function getActiveSession(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("live_sessions")
    .select("id, title, status, started_at, current_product_id")
    .in("status", ["live", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}
