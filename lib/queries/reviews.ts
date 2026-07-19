import type { SupabaseClient } from "@supabase/supabase-js"

export function getProductReviews(client: SupabaseClient, productId: number, onlyApproved = true, limit = 10) {
  let query = client
    .from("reviews")
    .select("id, title, content, rating, is_verified, created_at")
    .eq("product_id", productId)
    .limit(limit)

  if (onlyApproved) query = query.eq("is_approved", true)

  return query
}

export function getApprovedReviews(client: SupabaseClient, limit = 6) {
  return client
    .from("reviews")
    .select("id, rating, content")
    .eq("is_approved", true)
    .limit(limit)
}

export function createReview(
  client: SupabaseClient,
  review: {
    productId: number
    userId?: string | null
    sessionKey?: string | null
    rating: number
    title?: string
    content?: string
  },
) {
  return client
    .from("reviews")
    .insert({
      product_id: review.productId,
      user_id: review.userId ?? null,
      session_key: review.sessionKey ?? null,
      rating: review.rating,
      title: review.title ?? "",
      content: review.content ?? "",
      is_verified: false,
      is_approved: false,
    })
    .select("id")
    .single()
}
