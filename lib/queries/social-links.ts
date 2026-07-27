import type { SupabaseClient } from "@supabase/supabase-js"

export interface SocialLink {
  id: number
  platform: string
  label: string
  url: string
  is_active: boolean
}

export async function getSocialLinks(client: SupabaseClient) {
  const { data } = await client
    .from("social_links")
    .select("id, platform, label, url, is_active")
    .eq("is_active", true)
    .order("id", { ascending: true }) as unknown as { data: SocialLink[] | null }
  return data ?? []
}

export async function getAllSocialLinks(client: SupabaseClient) {
  const { data } = await client
    .from("social_links")
    .select("*")
    .order("id", { ascending: true }) as unknown as { data: SocialLink[] | null }
  return data ?? []
}

export async function updateSocialLink(
  client: SupabaseClient,
  id: number,
  updates: { url?: string; is_active?: boolean },
) {
  const { error } = await client
    .from("social_links")
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
  return { error }
}
