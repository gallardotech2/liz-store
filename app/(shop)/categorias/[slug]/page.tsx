import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createStaticClient } from "@/lib/supabase/static"
import { ProductCard } from "@/components/ui/ProductCard"
import { Button } from "@/components/ui/Button"
import type { Metadata } from "next"

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .limit(50)

    return ((data ?? []) as { slug: string }[]).map((c) => ({ slug: c.slug }))
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
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  const cat = data as { name: string; description: string | null } | null
  if (!cat) return { title: "Categoría no encontrada" }

  return {
    title: cat.name,
    description: cat.description || undefined,
  }
}

const PAGE_SIZE = 12

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt((sp.page as string) || "1"))

  const supabase = await createClient()
  const s = supabase as any

  const { data: categoryRaw } = await s
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!categoryRaw) notFound()
  const category = categoryRaw as { id: number; name: string; slug: string; description: string | null; image: string | null; is_active: boolean; order: number }

  let query = s
    .from("products")
    .select(
      "id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug), product_images(image, is_main)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data: productsRaw, count } = await query.range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

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
    category: { id: number; name: string; slug: string } | { id: number; name: string; slug: string }[]
    product_images?: Array<{ image: string; is_main: boolean }>
  }

  const getMainImage = (p: RawProduct): string | null => {
    const images = p.product_images
    const main = images?.find((img) => img.is_main) ?? images?.[0]
    return main?.image ?? null
  }

  const products = ((productsRaw ?? []) as RawProduct[]).map((p) => {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discount_price,
      rating: p.rating,
      ratingCount: p.rating_count,
      isNew: p.is_new,
      isFeatured: p.is_featured,
      category: { name: cat?.name ?? "", slug: cat?.slug ?? "" },
      image: getMainImage(p),
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
            href="/productos"
            className="text-primary no-underline hover:underline"
            prefetch={false}
          >
            Catálogo
          </Link>{" "}
          / <span>{category.name}</span>
        </div>
      </div>

      <section className="py-0">
        <div className="max-w-7xl mx-auto px-4">
          {category.image && (
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          )}
          <div className="text-center mb-12">
            <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
              {category.name}
            </div>
            <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                {category.description}
              </p>
            )}
          </div>

          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-md:gap-3.75">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <>
                      <Link
                        href={`/categorias/${slug}?page=1`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white text-[#4A4A4A] border border-[#EEE] hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        &laquo;
                      </Link>
                      <Link
                        href={`/categorias/${slug}?page=${page - 1}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white text-[#4A4A4A] border border-[#EEE] hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        Anterior
                      </Link>
                    </>
                  )}
                  <span className="px-4.5 py-2.5 rounded-[8px] text-[14px] font-medium bg-primary text-white border border-primary">
                    {page} de {totalPages}
                  </span>
                  {page < totalPages && (
                    <>
                      <Link
                        href={`/categorias/${slug}?page=${page + 1}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white text-[#4A4A4A] border border-[#EEE] hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        Siguiente
                      </Link>
                      <Link
                        href={`/categorias/${slug}?page=${totalPages}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white text-[#4A4A4A] border border-[#EEE] hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        &raquo;
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-[64px] text-[rgb(251,132,150)] mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h2 className="text-[#2D2D2D] mb-3 font-serif text-2xl">
                Próximamente
              </h2>
              <p className="text-[#888888] mb-6">
                Estamos preparando nuevos productos para esta categoría.
              </p>
              <Link href="/productos" prefetch={false}>
                <Button variant="primary">Ver catálogo completo</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
