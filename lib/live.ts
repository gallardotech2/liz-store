import { cache } from "react"
import { connection } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import {
  buildHotCampaign,
  isHotSessionActive,
  type HotCampaign,
  type HotProductRow,
  type HotSessionRow,
} from "@/lib/hot"

const HOT_SESSION_SELECT =
  "id, title, status, started_at, ends_at, duration_hours, current_product_id"

const HOT_PRODUCT_SELECT = `
  product_id,
  promo_price,
  status,
  order,
  shown_at,
  products(
    id,
    name,
    slug,
    price,
    discount_price,
    stock,
    rating,
    rating_count,
    is_new,
    is_featured,
    is_active,
    category:categories(id, name, slug),
    product_images(image, is_main)
  )
`

export async function fetchActiveHotCampaign(
  supabase: SupabaseClient,
): Promise<HotCampaign | null> {
  const { data: session, error: sessionError } = await supabase
    .from("live_sessions")
    .select(HOT_SESSION_SELECT)
    .eq("status", "live")
    .eq("is_global", true)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) throw sessionError
  if (!session || !isHotSessionActive(session as HotSessionRow)) return null

  const hotSession = session as HotSessionRow

  const { data: rows, error: productsError } = await supabase
    .from("live_products")
    .select(HOT_PRODUCT_SELECT)
    .eq("session_id", hotSession.id)
    .order("order", { ascending: true })
    .order("id", { ascending: true })

  if (productsError) throw productsError

  return buildHotCampaign(
    hotSession,
    (rows ?? []) as unknown as HotProductRow[],
    { publicOnly: true },
  )
}

export const getActiveHotCampaign = cache(async (): Promise<HotCampaign | null> => {
  await connection()
  const supabase = await createClient()
  return fetchActiveHotCampaign(supabase)
})
