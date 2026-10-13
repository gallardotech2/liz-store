import type { SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { createStaticClient } from "@/lib/supabase/static"

export function getCategories(client: SupabaseClient, onlyActive = true) {
  let query = client
    .from("categories")
    .select("*")
    .order("order")

  if (onlyActive) query = query.eq("is_active", true)

  return query
}

export function getCategoryBySlug(client: SupabaseClient, slug: string) {
  return client
    .from("categories")
    .select("id, name, slug, description, image, icon")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
}

export function getCategoryIdBySlug(client: SupabaseClient, slug: string) {
  return client
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
}

export const getShopCategoriesMenu = unstable_cache(
  async (): Promise<Array<{ name: string; slug: string }>> => {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true)
      .order("order")
      .limit(10)
    return (data ?? []) as Array<{ name: string; slug: string }>
  },
  ["shop-categories-menu"],
  { revalidate: 3600, tags: ["categories"] },
)
