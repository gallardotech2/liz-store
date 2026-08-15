"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

export async function updateStoreWhatsApp(formData: FormData) {
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").trim()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY")

  const supabase = createClient(url, serviceKey)

  const { data: row } = await supabase
    .from("store_profiles")
    .select("id")
    .limit(1)
    .maybeSingle()

  const id = row?.id
  if (id == null) throw new Error("No se encontró el perfil de la tienda")

  const { error } = await supabase
    .from("store_profiles")
    .update({ whatsapp_number } as never)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/store")
  revalidatePath("/")
}