import type { SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { createStaticClient } from "@/lib/supabase/static"

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

export async function getWhatsappGroupLink(client: SupabaseClient): Promise<string> {
  const { data } = await client
    .from("social_links")
    .select("url")
    .eq("platform", "whatsapp_group")
    .eq("is_active", true)
    .maybeSingle() as unknown as { data: { url: string } | null }
  return data?.url?.trim() ?? ""
}

export const getWhatsappGroupLinkCached = unstable_cache(
  async () => getWhatsappGroupLink(createStaticClient()),
  ["whatsapp-group-link"],
  { revalidate: 60, tags: ["social-links"] },
)

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
