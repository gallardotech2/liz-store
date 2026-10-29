"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { parseLiveCodeInput } from "@/lib/live-code"
import { parseLiveUrlInput } from "@/lib/live-url"
import type { LiveProductStatus } from "@/types/database"

const LIVE_PRODUCT_STATUSES: LiveProductStatus[] = [
  "available",
  "requested",
  "reserved",
  "sold",
]

function revalidateHot(sessionId?: number) {
  revalidatePath("/", "layout")
  revalidatePath("/admin/lives")
  if (sessionId) {
    revalidatePath(`/admin/lives/${sessionId}`)
    revalidatePath(`/admin/lives/${sessionId}/editar`)
    revalidatePath(`/admin/lives/${sessionId}/studio`)
  }
}

function parseFutureDate(value: string | null | undefined): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha de finalización no es válida.")
  }
  if (date.getTime() <= Date.now()) {
    throw new Error("La finalización debe ser una fecha futura.")
  }
  return date.toISOString()
}

function parseDuration(formData: FormData): number | null {
  const raw = formData.get("duration_hours")
  if (raw === null || String(raw).trim() === "") return null

  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("La duración debe ser un número entero mayor a 0")
  }
  return value
}

function readPromoPrice(formData: FormData): {
  value: number | null
  error: string | null
} {
  const raw = formData.get("promo_price")
  if (raw === null || String(raw).trim() === "") {
    return { value: null, error: null }
  }

  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    return {
      value: null,
      error: "El precio del Modo Live debe ser un número mayor o igual a 0.",
    }
  }
  return { value, error: null }
}

function formatPrice(value: number) {
  return `Bs. ${Number(value).toFixed(2)}`
}

async function validateHotPromo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: number,
  promoPrice: number | null,
): Promise<{ error: string | null }> {
  const { data: product, error } = await (supabase as any)
    .from("products")
    .select("name, price, discount_price, is_active")
    .eq("id", productId)
    .single()

  if (error || !product) return { error: "Producto no encontrado." }
  if (!product.is_active) return { error: "El producto está inactivo." }
  if (promoPrice === null) return { error: null }

  const normal = product.discount_price ?? product.price
  if (normal === null || normal === undefined) {
    return { error: "El producto no tiene un precio normal definido." }
  }

  const normalPrice = Number(normal)
  if (promoPrice >= normalPrice) {
    return {
      error:
        `El precio del Modo Live (${formatPrice(promoPrice)}) debe ser menor al precio normal ` +
        `(${formatPrice(normalPrice)}) de ${product.name}.`,
    }
  }

  return { error: null }
}

export async function createLiveSession(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const title = String(formData.get("title") ?? "").trim()
  const storeIdRaw = formData.get("store_id")
  const store_id = storeIdRaw ? Number(storeIdRaw) : null
  const duration_hours = parseDuration(formData)

  if (!title) throw new Error("El título es obligatorio")

  const { data, error } = await (supabase as any)
    .from("live_sessions")
    .insert({
      title,
      store_id,
      status: "not_started",
      duration_hours,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidateHot(data.id)
  redirect(`/admin/lives/${data.id}/editar`)
}

export async function updateLiveSession(id: number, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const title = String(formData.get("title") ?? "").trim()
  const storeIdRaw = formData.get("store_id")
  const store_id = storeIdRaw ? Number(storeIdRaw) : null
  const notes = String(formData.get("notes") ?? "")

  if (!title) throw new Error("El título es obligatorio")

  const { data: session, error: sessionError } = await (supabase as any)
    .from("live_sessions")
    .select("status")
    .eq("id", id)
    .single()

  if (sessionError) throw new Error(sessionError.message)
  if (!session) throw new Error("Modo Live no encontrado")

  const updates: Record<string, unknown> = {
    title,
    store_id,
    notes,
  }

  if (session.status === "not_started") {
    updates.duration_hours = parseDuration(formData)
  }

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateHot(id)
  redirect(`/admin/lives/${id}/editar`)
}

export async function deleteLiveSession(id: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateHot()
  redirect("/admin/lives")
}

export async function addProductToLiveSession(
  liveSessionId: number,
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAdmin()
  const supabase = await createClient()

  const product_id = Number(formData.get("product_id"))
  const order = Number(formData.get("order") || 0)
  const promo = readPromoPrice(formData)

  if (!Number.isInteger(product_id) || product_id <= 0) {
    return { error: "Selecciona un producto válido." }
  }
  if (!Number.isInteger(order) || order < 0) {
    return { error: "El orden debe ser un entero mayor o igual a 0." }
  }
  if (promo.error) return { error: promo.error }

  const validation = await validateHotPromo(supabase, product_id, promo.value)
  if (validation.error) return validation

  const { error } = await (supabase as any).rpc("add_hot_product", {
    p_session_id: liveSessionId,
    p_product_id: product_id,
    p_order: order,
    p_promo_price: promo.value,
  })

  if (error) return { error: error.message }

  revalidateHot(liveSessionId)
  return { error: null }
}

export async function addProductsToLiveSession(
  liveSessionId: number,
  productIds: number[],
): Promise<{ error: string | null; added: number }> {
  await requireAdmin()
  const supabase = await createClient()

  const uniqueIds = [...new Set(productIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (!Number.isInteger(liveSessionId) || liveSessionId <= 0) {
    return { error: "Modo Live inválido.", added: 0 }
  }
  if (uniqueIds.length === 0) {
    return { error: "Selecciona al menos un producto.", added: 0 }
  }

  const { data, error } = await (supabase as any).rpc("add_hot_products", {
    p_session_id: liveSessionId,
    p_product_ids: uniqueIds,
  })

  if (error) return { error: error.message, added: 0 }

  revalidateHot(liveSessionId)
  return { error: null, added: Number(data ?? 0) }
}

export async function removeProductFromLiveSession(
  liveSessionId: number,
  productId: number,
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any).rpc("remove_hot_product", {
    p_session_id: liveSessionId,
    p_product_id: productId,
  })

  if (error) throw new Error(error.message)

  revalidateHot(liveSessionId)
}

export async function updateHotProductPromo(
  liveSessionId: number,
  productId: number,
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAdmin()
  const supabase = await createClient()

  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "Producto inválido." }
  }

  const promo = readPromoPrice(formData)
  if (promo.error) return { error: promo.error }

  const validation = await validateHotPromo(supabase, productId, promo.value)
  if (validation.error) return validation

  const { error } = await (supabase as any).rpc("update_hot_product_promo", {
    p_session_id: liveSessionId,
    p_product_id: productId,
    p_promo_price: promo.value,
  })

  if (error) return { error: error.message }

  revalidateHot(liveSessionId)
  return { error: null }
}

export async function updateProductLiveCode(
  liveSessionId: number,
  productId: number,
  formData: FormData,
): Promise<{ error: string | null; code?: string | null }> {
  await requireAdmin()

  if (!Number.isInteger(liveSessionId) || liveSessionId <= 0) {
    return { error: "Modo Live inválido." }
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "Producto inválido." }
  }

  const input = parseLiveCodeInput(formData.get("live_code"))
  if (input.error) return { error: input.error }

  const supabase = await createClient()

  const { data: membership, error: membershipError } = await supabase
    .from("live_products")
    .select("product_id")
    .eq("session_id", liveSessionId)
    .eq("product_id", productId)
    .maybeSingle()

  if (membershipError) return { error: membershipError.message }
  if (!membership) {
    return { error: "El producto no pertenece al catálogo del Modo Live." }
  }

  if (input.code !== null) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("products")
      .select("id")
      .eq("live_code", input.code)
      .neq("id", productId)
      .maybeSingle()

    if (duplicateError) {
      return {
        error: duplicateError.message?.includes("live_code")
          ? "Falta aplicar la migración del identificador (Fix 0024) en Supabase."
          : duplicateError.message,
      }
    }
    if (duplicate) {
      return {
        error: `El identificador ${input.code} ya está asignado a otro producto.`,
      }
    }
  }

  const { data: updated, error } = await (supabase as any)
    .from("products")
    .update({ live_code: input.code })
    .eq("id", productId)
    .select("id")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") {
      return {
        error: `El identificador ${input.code} ya está asignado a otro producto.`,
      }
    }
    if (error.message?.includes("live_code")) {
      return {
        error: "Falta aplicar la migración del identificador (Fix 0024) en Supabase.",
      }
    }
    return { error: error.message }
  }
  if (!updated) {
    return {
      error: "No se pudo guardar el identificador. Verifica tus permisos.",
    }
  }

  revalidateHot(liveSessionId)
  return { error: null, code: input.code }
}

export async function updateHotProductStatus(
  liveSessionId: number,
  productId: number,
  status: LiveProductStatus,
) {
  await requireAdmin()

  if (!LIVE_PRODUCT_STATUSES.includes(status)) {
    throw new Error("Estado de producto inválido")
  }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from("live_products")
    .update({ status })
    .eq("session_id", liveSessionId)
    .eq("product_id", productId)

  if (error) throw new Error(error.message)

  revalidateHot(liveSessionId)
}

export async function startLiveSession(id: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any).rpc("activate_hot_session", {
    p_session_id: id,
  })

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function pauseLiveSession(id: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({ status: "paused" })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function endLiveSession(id: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      ended_reason: "manual",
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function setCurrentLiveProduct(
  id: number,
  productId: number | null,
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await (supabase as any).rpc("set_hot_current_product", {
    p_session_id: id,
    p_product_id: productId,
  })

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function ensureLiveMode() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: existing, error: lookupError } = await (supabase as any)
    .from("live_sessions")
    .select("id")
    .eq("is_global", true)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)
  if (existing?.id) redirect("/admin/lives")

  const { data, error } = await (supabase as any)
    .from("live_sessions")
    .insert({
      title: "Modo Live",
      status: "ended",
      is_global: true,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidateHot(data.id)
  redirect("/admin/lives")
}

export async function startLiveMode(
  id: number,
  endsAt: string | null = null,
) {
  await requireAdmin()
  const supabase = await createClient()
  const endsAtIso = parseFutureDate(endsAt)

  const { error } = await (supabase as any).rpc("start_live_mode", {
    p_session_id: id,
    p_ends_at: endsAtIso,
  })

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function scheduleLiveEnd(
  id: number,
  endsAt: string | null,
) {
  await requireAdmin()
  const supabase = await createClient()
  const endsAtIso = parseFutureDate(endsAt)

  const { data: session, error: sessionError } = await (supabase as any)
    .from("live_sessions")
    .select("is_global, status, ends_at")
    .eq("id", id)
    .maybeSingle()

  if (sessionError) throw new Error(sessionError.message)
  if (!session?.is_global) throw new Error("Modo Live no encontrado.")
  if (session.status !== "live") {
    throw new Error("Inicia el Modo Live antes de programar su finalización.")
  }
  if (session.ends_at && new Date(session.ends_at).getTime() <= Date.now()) {
    throw new Error("El Modo Live venció. Inícialo de nuevo.")
  }

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      ends_at: endsAtIso,
      duration_hours: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_global", true)

  if (error) throw new Error(error.message)

  revalidateHot(id)
}

export async function updateLiveModeTitle(id: number, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const title = String(formData.get("title") ?? "").trim()

  if (!title) throw new Error("El título es obligatorio.")

  const { data: session, error: sessionError } = await (supabase as any)
    .from("live_sessions")
    .select("id")
    .eq("id", id)
    .eq("is_global", true)
    .maybeSingle()

  if (sessionError) throw new Error(sessionError.message)
  if (!session) throw new Error("Modo Live no encontrado.")

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_global", true)

  if (error) throw new Error(error.message)

  revalidateHot(id)
  redirect(`/admin/lives/${id}/editar`)
}

export async function updateLiveModeUrl(
  id: number,
  formData: FormData,
): Promise<{ error: string | null; url?: string | null }> {
  await requireAdmin()

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Modo Live inválido." }
  }

  const input = parseLiveUrlInput(formData.get("live_url"))
  if (input.error) return { error: input.error }

  const supabase = await createClient()

  const { data: session, error: sessionError } = await (supabase as any)
    .from("live_sessions")
    .select("id")
    .eq("id", id)
    .eq("is_global", true)
    .maybeSingle()

  if (sessionError) return { error: sessionError.message }
  if (!session) return { error: "Modo Live no encontrado." }

  const { error } = await (supabase as any)
    .from("live_sessions")
    .update({
      live_url: input.url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_global", true)

  if (error) {
    if (
      error.code === "42703" ||
      error.code === "PGRST204" ||
      error.message?.includes("live_url")
    ) {
      return {
        error:
          "Falta aplicar la migración de la URL del Live (Fix 0025) en Supabase.",
      }
    }
    return { error: error.message }
  }

  revalidateHot(id)
  return { error: null, url: input.url }
}

export async function moveLiveProduct(
  liveSessionId: number,
  productId: number,
  direction: "up" | "down",
) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from("live_products")
    .select('product_id, "order"')
    .eq("session_id", liveSessionId)
    .order("order", { ascending: true })
    .order("id", { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<{
    product_id: number
    order: number | null
  }>
  const index = rows.findIndex((row) => row.product_id === productId)
  if (index === -1) return

  const target = direction === "up" ? index - 1 : index + 1
  if (target < 0 || target >= rows.length) return

  const reordered = [...rows]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(target, 0, moved)

  const { error: updateError } = await (supabase as any)
    .from("live_products")
    .upsert(
      reordered.map((row, position) => ({
        session_id: liveSessionId,
        product_id: row.product_id,
        order: position,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "session_id,product_id" },
    )

  if (updateError) throw new Error(updateError.message)

  revalidateHot(liveSessionId)
}

export async function finalizeExpiredLiveMode(id: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from("live_sessions")
    .select("status, ends_at")
    .eq("id", id)
    .eq("is_global", true)
    .maybeSingle()

  if (error || !data) return
  if (data.status !== "live" || !data.ends_at) return
  if (new Date(data.ends_at).getTime() > Date.now()) return

  const { error: updateError } = await (supabase as any)
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      ended_reason: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_global", true)

  if (updateError) return

  revalidateHot(id)
}
