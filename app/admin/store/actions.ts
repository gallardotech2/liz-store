"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"

export async function updateStoreWhatsApp(formData: FormData) {
  await requireAdmin()
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").trim()

  const supabase = await createClient()

  const { data: row } = await supabase
    .from("store_profiles")
    .select("id")
    .limit(1)
    .maybeSingle()

  const id = (row as unknown as { id: number | null })?.id
  if (id == null) throw new Error("No se encontró el perfil de la tienda")

  const { error } = await supabase
    .from("store_profiles")
    .update({ whatsapp_number } as never)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/store")
  revalidatePath("/")
}