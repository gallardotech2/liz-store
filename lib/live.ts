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

const HOT_SESSION_BASE_SELECT =
  "id, title, status, started_at, ends_at, duration_hours, current_product_id"

const HOT_SESSION_SELECT = `${HOT_SESSION_BASE_SELECT}, live_url`

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
    short_description,
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

function isMissingLiveUrlColumn(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    Boolean(error.message?.includes("live_url"))
  )
}

async function fetchActiveSession(
  supabase: SupabaseClient,
  select: string,
) {
  return supabase
    .from("live_sessions")
    .select(select)
    .eq("status", "live")
    .eq("is_global", true)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function fetchActiveHotCampaign(
  supabase: SupabaseClient,
): Promise<HotCampaign | null> {
  let { data: session, error: sessionError } = await fetchActiveSession(
    supabase,
    HOT_SESSION_SELECT,
  )

  if (sessionError && isMissingLiveUrlColumn(sessionError)) {
    const fallback = await fetchActiveSession(
      supabase,
      HOT_SESSION_BASE_SELECT,
    )
    session = fallback.data
    sessionError = fallback.error
  }

  if (sessionError) throw sessionError
  if (
    !session ||
    !isHotSessionActive(session as unknown as HotSessionRow)
  ) {
    return null
  }

  const hotSession = session as unknown as HotSessionRow

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
