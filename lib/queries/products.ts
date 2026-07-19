import type { SupabaseClient } from "@supabase/supabase-js"

export function getProducts(
  client: SupabaseClient,
  options?: {
    categoryId?: number
    isActive?: boolean
    isFeatured?: boolean
    isNew?: boolean
    search?: string
    sort?: "newest" | "price_asc" | "price_desc" | "rating" | "name_asc"
    page?: number
    pageSize?: number
  },
) {
  const {
    categoryId,
    isActive: active = true,
    isFeatured,
    isNew,
    search,
    sort = "newest",
    page = 1,
    pageSize = 12,
  } = options ?? {}

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from("products")
    .select("*, category:categories(id, name, slug), product_images(id, image, alt_text, is_main, order)", { count: "exact" })
    .eq("is_active", active)
    .range(from, to)

  if (categoryId) query = query.eq("category_id", categoryId)
  if (isFeatured) query = query.eq("is_featured", true)
  if (isNew) query = query.eq("is_new", true)
  if (search) query = query.ilike("name", `%${search}%`)

  switch (sort) {
    case "price_asc":
      return query.order("price", { ascending: true })
    case "price_desc":
      return query.order("price", { ascending: false })
    case "rating":
      return query.order("rating", { ascending: false })
    case "name_asc":
      return query.order("name", { ascending: true })
    default:
      return query.order("created_at", { ascending: false })
  }
}

export function getProductBySlug(client: SupabaseClient, slug: string) {
  return client
    .from("products")
    .select("*, category:categories(id, name, slug), product_images(id, image, alt_text, is_main, order)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
}

export function getProductById(client: SupabaseClient, id: number) {
  return client
    .from("products")
    .select("*, product_images(image, is_main)")
    .eq("id", id)
    .eq("is_active", true)
    .single()
}

export function getProductsByIds(client: SupabaseClient, ids: number[]) {
  return client
    .from("products")
    .select("id, price, discount_price, stock, slug, name, product_images(image, is_main)")
    .in("id", ids)
    .eq("is_active", true)
}

export function getFeaturedProducts(client: SupabaseClient, limit = 8) {
  return client
    .from("products")
    .select("id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(limit)
}

export function getNewProducts(client: SupabaseClient, limit = 8) {
  return client
    .from("products")
    .select("id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug)")
    .eq("is_active", true)
    .eq("is_new", true)
    .limit(limit)
}

export function getRelatedProducts(client: SupabaseClient, productId: number, categoryId: number, limit = 4) {
  return client
    .from("products")
    .select("id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .limit(limit)
}

export function getProductStock(client: SupabaseClient, id: number) {
  return client
    .from("products")
    .select("stock")
    .eq("id", id)
    .eq("is_active", true)
    .single()
}

export function getAllSlugs(client: SupabaseClient, limit = 100) {
  return client
    .from("products")
    .select("slug")
    .eq("is_active", true)
    .limit(limit)
}

export function getProductMetadata(client: SupabaseClient, slug: string) {
  return client
    .from("products")
    .select("name, meta_description, meta_keywords")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
}
