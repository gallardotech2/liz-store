import type { SupabaseClient } from "@supabase/supabase-js"

export function getProfile(client: SupabaseClient, id: string) {
  return client
    .from("profiles")
    .select("id, nombre, avatar, phone, role")
    .eq("id", id)
    .single()
}

export function updateProfile(
  client: SupabaseClient,
  id: string,
  data: {
    nombre?: string
    avatar?: string | null
    phone?: string
  },
) {
  return client
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select("id, nombre, avatar, phone, role")
    .single()
}

export function getAddresses(client: SupabaseClient, userId: string) {
  return client
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
}

export function createAddress(
  client: SupabaseClient,
  address: {
    userId: string
    name: string
    phone: string
    street: string
    colony?: string
    city?: string
    state?: string
    zipCode?: string
    references?: string
    isDefault?: boolean
  },
) {
  return client
    .from("addresses")
    .insert(address)
    .select("id")
    .single()
}

export function deleteAddress(client: SupabaseClient, id: number) {
  return client
    .from("addresses")
    .delete()
    .eq("id", id)
}
