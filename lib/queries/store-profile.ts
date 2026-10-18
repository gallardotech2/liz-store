import type { SupabaseClient } from "@supabase/supabase-js"
import { WHATSAPP_NUMBER } from "@/lib/constants"

export interface StoreProfile {
  id: number
  name: string
  qr_code: string | null
  account_name: string
  account_number: string
  bank_name: string
  whatsapp_number: string
}

export async function getStoreProfile(client: SupabaseClient): Promise<StoreProfile | null> {
  const { data } = await client
    .from("store_profiles")
    .select("id, name, qr_code, account_name, account_number, bank_name, whatsapp_number")
    .limit(1)
    .maybeSingle() as unknown as { data: StoreProfile | null }
  return data
}

export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/[\s\-().+]/g, "")
}

export async function getOrderWhatsAppNumber(client: SupabaseClient): Promise<string> {
  const profile = await getStoreProfile(client)
  if (profile?.whatsapp_number?.trim()) {
    const num = normalizeWhatsAppNumber(profile.whatsapp_number)
    if (/^\d{8,15}$/.test(num)) return num
  }
  return WHATSAPP_NUMBER
}

export async function updateStoreWhatsAppNumber(
  client: SupabaseClient,
  id: number,
  whatsapp_number: string,
) {
  const { error } = await client
    .from("store_profiles")
    .update({ whatsapp_number } as never)
    .eq("id", id)
  return { error }
}