import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liz-store.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const s = supabase as any

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/productos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/categorias`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/carrito`, lastModified: new Date(), changeFrequency: "never", priority: 0.2 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: "never", priority: 0.2 },
    { url: `${BASE_URL}/auth/registro`, lastModified: new Date(), changeFrequency: "never", priority: 0.2 },
  ]

  const { data: products } = await s
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(500)

  const { data: categories } = await s
    .from("categories")
    .select("slug, updated_at")
    .eq("is_active", true)

  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p: any) => ({
    url: `${BASE_URL}/productos/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((c: any) => ({
    url: `${BASE_URL}/categorias/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}
