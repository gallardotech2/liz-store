"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createLiveSession(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const store_id = formData.get("store_id") ? Number(formData.get("store_id")) : null

  if (!title?.trim()) throw new Error("El título es obligatorio")

  const { data, error } = await (supabase as any)
    .from("live_sessions")
    .insert({
      title: title.trim(),
      store_id,
      status: "not_started",
      total_products_shown: 0,
      total_products_sold: 0,
      total_reserved: 0,
      total_interested: 0,
      total_likes: 0,
      total_followers: 0,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
  redirect(`/admin/lives/${data.id}/editar`)
}

export async function updateLiveSession(id: number, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const store_id = formData.get("store_id") ? Number(formData.get("store_id")) : null
  const status = formData.get("status") as string
  const notes = (formData.get("notes") as string) || ""

  if (!title?.trim()) throw new Error("El título es obligatorio")

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      title: title.trim(),
      store_id,
      status,
      notes,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
  redirect("/admin/lives")
}

export async function deleteLiveSession(id: number) {
  const supabase = await createClient()

  const { data: products } = await (supabase as any)
    .from("live_session_products")
    .select("id")
    .eq("live_session_id", id)

  for (const p of products ?? []) {
    await (supabase as any).from("live_session_products").delete().eq("id", p.id)
  }

  const { data: liveProducts } = await (supabase as any)
    .from("live_products")
    .select("id")
    .eq("session_id", id)

  for (const p of liveProducts ?? []) {
    await (supabase as any).from("live_products").delete().eq("id", p.id)
  }

  const { data: interests } = await (supabase as any)
    .from("product_interests")
    .select("id")
    .eq("session_id", id)

  for (const i of interests ?? []) {
    await (supabase as any).from("product_interests").delete().eq("id", i.id)
  }

  const { error } = await (supabase as any).from("live_sessions").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
}

export async function addProductToLiveSession(liveSessionId: number, formData: FormData) {
  const supabase = await createClient()

  const product_id = Number(formData.get("product_id"))
  const order = Number(formData.get("order") || 0)

  if (!product_id) throw new Error("Selecciona un producto")

  const { error } = await (supabase as any).from("live_session_products").insert({
    live_session_id: liveSessionId,
    product_id,
    order,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/lives/${liveSessionId}/editar`)
}

export async function removeProductFromLiveSession(liveSessionId: number, productId: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_session_products")
    .delete()
    .eq("live_session_id", liveSessionId)
    .eq("product_id", productId)

  if (error) throw new Error(error.message)

  await (supabase as any).from("live_products").delete().eq("session_id", liveSessionId).eq("product_id", productId)

  revalidatePath(`/admin/lives/${liveSessionId}/editar`)
}

export async function startLiveSession(id: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      status: "live",
      started_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
  revalidatePath(`/admin/lives/${id}/studio`)
}

export async function pauseLiveSession(id: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({ status: "paused" })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
  revalidatePath(`/admin/lives/${id}/studio`)
}

export async function endLiveSession(id: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/lives")
  revalidatePath(`/admin/lives/${id}/studio`)
}

export async function setCurrentLiveProduct(id: number, productId: number | null) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({ current_product_id: productId })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/lives/${id}/studio`)
}