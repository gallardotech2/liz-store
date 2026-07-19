import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createStaticClient } from "@/lib/supabase/static"
import { ProductCard } from "@/components/ui/ProductCard"
import { formatCurrency } from "@/lib/utils"
import { addToCartAction } from "../../carrito/actions"
import { AddToCartForm } from "./AddToCartForm"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"
import type { Metadata } from "next"

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true)

    return ((data ?? []) as { slug: string }[]).map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cleanSlug = slug.trim()
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("name, meta_description, meta_keywords")
    .eq("slug", cleanSlug)
    .eq("is_active", true)
    .single()

  const prod = data as { name: string; meta_description: string | null; meta_keywords: string | null } | null
  if (!prod) return { title: "Producto no encontrado" }

  return {
    title: prod.name,
    description: prod.meta_description || undefined,
    keywords: prod.meta_keywords || undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cleanSlug = slug.trim()
  const supabase = await createClient()
  const s = supabase as any

  const { data: product } = await s
    .from("products")
    .select(
      "*, category:categories(id, name, slug), product_images(id, image, alt_text, is_main, order)",
    )
    .eq("slug", cleanSlug)
    .eq("is_active", true)
    .single()

  if (!product) notFound()

  type RawProduct = {
    id: number
    name: string
    slug: string
    price: number
    discount_price: number | null
    rating: number
    rating_count: number
    is_new: boolean
    is_featured: boolean
    stock: number
    short_description: string
    long_description: string
    sku: string
    category_id: number
    category: { id: number; name: string; slug: string }
    product_images: Array<{
      id: number
      image: string
      alt_text: string
      is_main: boolean
      order: number
    }>
  }

  const p = product as unknown as RawProduct
  const hasDiscount =
    p.discount_price !== null && p.discount_price < p.price
  const displayPrice = hasDiscount ? p.discount_price! : p.price
  const discountPct = hasDiscount
    ? Math.round(((p.price - p.discount_price!) / p.price) * 100)
    : 0

  const sortedImages = [...(p.product_images ?? [])].sort(
    (a, b) => a.order - b.order,
  )
  const mainImage = sortedImages.find((img) => img.is_main) ?? sortedImages[0]

  const cat = Array.isArray(p.category) ? p.category[0] : p.category

  const { data: reviews } = await s
    .from("reviews")
    .select("id, title, content, rating, is_verified, created_at")
    .eq("product_id", p.id)
    .eq("is_approved", true)
    .limit(10)

  const { data: relatedRaw } = await s
    .from("products")
    .select(
      "id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug), product_images(image, is_main)",
    )
    .eq("is_active", true)
    .eq("category_id", p.category_id)
    .neq("id", p.id)
    .limit(4)

  const relatedData = (relatedRaw ?? []) as Array<{
    id: number
    name: string
    slug: string
    price: number
    discount_price: number | null
    rating: number
    rating_count: number
    is_new: boolean
    is_featured: boolean
    category: { id: number; name: string; slug: string } | { id: number; name: string; slug: string }[]
    product_images?: Array<{ image: string; is_main: boolean }>
  }>
  const related = relatedData.map((rp) => {
    const rcat = Array.isArray(rp.category) ? rp.category[0] : rp.category
    const rpImages = rp.product_images
    const rpMain = rpImages?.find((img) => img.is_main) ?? rpImages?.[0]
    return {
      id: rp.id,
      name: rp.name,
      slug: rp.slug,
      price: rp.price,
      discountPrice: rp.discount_price,
      rating: rp.rating,
      ratingCount: rp.rating_count,
      isNew: rp.is_new,
      isFeatured: rp.is_featured,
      category: { name: rcat?.name ?? "", slug: rcat?.slug ?? "" },
      image: rpMain?.image ?? null,
    }
  })

  return (
    <>
      <div className="max-w-7xl mx-auto px-4">
        <div className="breadcrumbs py-5 text-[14px] text-[#888888]">
          <Link href="/" className="text-primary no-underline hover:underline">
            Inicio
          </Link>{" "}
          /{" "}
          <Link
            href={`/categorias/${cat.slug}`}
            className="text-primary no-underline hover:underline"
          >
            {cat.name}
          </Link>{" "}
          / <span>{p.name}</span>
        </div>
      </div>

      <section>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-[1fr_1fr] gap-12.5 py-15 max-lg:grid-cols-1">
            <div className="sticky top-[100px] max-lg:static">
              <div className="aspect-square rounded-[16px] overflow-hidden bg-[#FFFBF9] mb-3.75">
                {mainImage ? (
                  <Image
                    src={mainImage.image}
                    alt={mainImage.alt_text || p.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover object-center"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)] text-4xl bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  </div>
                )}
              </div>
              {sortedImages.length > 1 && (
                <div className="flex gap-2.5">
                  {sortedImages.map((img) => (
                   <div
                       key={img.id}
                       className="w-20 h-20 rounded-[8px] overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors duration-300"
                     >
                       <Image
                         src={img.image}
                         alt={img.alt_text || p.name}
                         width={80}
                         height={80}
                         className="w-full h-full object-cover object-center"
                       />
                     </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-5">
              <div className="text-[12px] text-[rgb(154,90,99)] uppercase tracking-[1px] font-semibold mb-2.5">
                {cat.name}
              </div>
              <h1 className="text-[clamp(24px,3vw,36px)] font-serif mb-4 text-[#2D2D2D]">
                {p.name}
              </h1>

              {p.rating_count > 0 && (
                <div className="flex items-center gap-1.5 text-base mb-4">
                  <span className="text-[#F4B740] tracking-[1px]">
                    {"★".repeat(Math.round(p.rating))}
                    {"☆".repeat(5 - Math.round(p.rating))}
                  </span>
                  <span className="text-[#888888]">
                    {p.rating} ({p.rating_count} reseñas)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap my-4">
                <span className="text-[28px] font-bold text-[rgb(154,90,99)] font-serif inline-flex items-center gap-0.5">
                  {formatCurrency(displayPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-[#888888] line-through inline-flex items-center gap-0.5">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-[12px] text-white bg-[#E74C3C] px-2 py-0.5 rounded font-semibold">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 my-4 text-sm">
                {p.stock > 0 ? (
                  <span className="text-[#27AE60] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    En stock ({p.stock} disponibles)
                  </span>
                ) : (
                  <span className="text-[#E74C3C] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Agotado
                  </span>
                )}
              </div>

              {p.short_description && (
                <div className="my-6 leading-[1.8] text-[#888888]">
                  {p.short_description}
                </div>
              )}

              {p.stock > 0 && (
                <AddToCartForm
                  productId={p.id}
                  productName={p.name}
                  productSlug={p.slug}
                  price={displayPrice}
                  stock={p.stock}
                  addToCartAction={addToCartAction}
                />
              )}

              {ESCUDO_PAGO_ENABLED && (
                <div className="bg-gradient-to-br from-[#FDF8F6] to-[#F5E6E8] rounded-[8px] p-5 my-6 border border-[rgba(183,110,121,0.2)]">
                  <h4 className="flex items-center gap-2 text-sm mb-2 font-sans text-[#2D2D2D]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Escudo Pago
                  </h4>
                  <p className="text-[13px] text-[#888888] leading-[1.6]">
                    Tu dinero está protegido y solo se liberará cuando confirmes
                    que recibiste tu pedido. Compra con total tranquilidad.
                  </p>
                </div>
              )}

              {p.long_description && (
                <div className="mt-7.5">
                  <h3 className="font-sans text-lg mb-3 text-[#2D2D2D]">
                    Descripción
                  </h3>
                  <div
                    className="leading-[1.8] text-[#888888]"
                    dangerouslySetInnerHTML={{ __html: p.long_description }}
                  />
                </div>
              )}

              <div className="mt-5 text-[13px] text-[#888888]">
                <strong>SKU:</strong> {p.sku}
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Relacionados
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                También te puede gustar
              </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
              {related.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews && reviews.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Reseñas
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Opiniones de clientes
              </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
              {reviews.map(
                (review: {
                  id: number
                  title: string | null
                  content: string | null
                  rating: number
                  is_verified: boolean
                  created_at: string
                }) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(183,110,121,0.05)] transition-all duration-300 hover:shadow-[0_4px_15px_rgba(183,110,121,0.12)] hover:border-[rgb(251,132,150)]"
                  >
                    <div className="text-[#F4B740] text-lg mb-3 tracking-[1px]">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    {review.title && (
                      <h4 className="mb-2 text-sm font-semibold text-[#2D2D2D]">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-[15px] leading-[1.8] text-[#4A4A4A] mb-5 italic">
                      &ldquo;{review.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[rgb(251,132,150)] to-[#D4A5A5] flex items-center justify-center text-primary font-semibold text-lg">
                        C
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#2D2D2D]">
                          Cliente
                        </div>
                        <div className="text-[12px] text-[#888888]">
                          {review.is_verified
                            ? "✓ Compra verificada"
                            : "Compra verificada"}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
