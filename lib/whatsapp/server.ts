import { randomInt } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface WhatsappRequestPayload {
  user_id: string | null
  product_id: number
  product_name: string
  product_image: string
  product_price: number
  notes: string
}

export function generateReferenceCode(): string {
  return `PED-${randomInt(100000, 1000000)}`
}

export async function insertWhatsappRequest(
  admin: SupabaseClient,
  payload: WhatsappRequestPayload,
): Promise<{ referenceCode: string }> {
  let lastError: { code?: string; message?: string } | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const referenceCode = generateReferenceCode()
    const { data, error } = await admin
      .from("whatsapp_requests")
      .insert({
        ...payload,
        reference_code: referenceCode,
      })
      .select("reference_code")
      .single()

    if (!error) {
      const row = data as { reference_code: string } | null
      return { referenceCode: row?.reference_code ?? referenceCode }
    }

    lastError = error
    if (error.code !== "23505") break
  }

  throw lastError ?? new Error("No se pudo crear la solicitud")
}
