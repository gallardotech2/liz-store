import type { SupabaseClient } from "@supabase/supabase-js"

export function getStoreProfile(client: SupabaseClient) {
  return client
    .from("store_profiles")
    .select("*")
    .single()
}

export function updateStoreProfile(
  client: SupabaseClient,
  data: {
    name?: string
    logo?: string | null
    banner?: string | null
    qrCode?: string | null
    accountName?: string
    accountNumber?: string
    bankName?: string
  },
) {
  return client
    .from("store_profiles")
    .update(data)
    .eq("id", 1)
    .select("*")
    .single()
}
