import type { SupabaseClient } from "@supabase/supabase-js"

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
