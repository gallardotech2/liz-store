import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/ui/ProductCard"
import { Button } from "@/components/ui/Button"
import type { Metadata } from "next"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Aprovecha nuestras ofertas: piezas de bisutería seleccionadas a precios especiales.",
  alternates: {
    canonical: "/ofertas",
  },
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "Liz Store",
    title: "Ofertas",
    description:
      "Aprovecha nuestras ofertas: piezas de bisutería seleccionadas a precios especiales.",
    url: "/ofertas",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Liz Store — Bisutería y Accesorios Elegantes",
      },
    ],
  },
}

const PAGE_SIZE = 12

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt((sp.page as string) || "1"))

  const supabase = await createClient()
  const s = supabase as any

  const query = s
    .from("products")
    .select(
      "id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug), product_images(image, is_main)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("is_offer", true)
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
      <div className="max-w-7xl mx-auto px-4 max-md:hidden">
        <div className="breadcrumbs py-5 text-[14px] text-[#6B6B6B] dark:text-ink-soft">
          <Link href="/" className="text-primary no-underline hover:underline">
            Inicio
          </Link>{" "}
          / <span>Ofertas</span>
        </div>
      </div>

      <section className="py-0 pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
              Ofertas
            </div>
            <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D] dark:text-ink-strong">
              Piezas en oferta
            </h1>
            <p className="text-[#6B6B6B] dark:text-ink-soft text-base max-w-[500px] mx-auto">
              Aprovecha nuestros precios especiales por tiempo limitado.
            </p>
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
                        href="/ofertas?page=1"
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white dark:bg-surface-raised text-[#4A4A4A] dark:text-ink border border-[#EEE] dark:border-line hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        &laquo;
                      </Link>
                      <Link
                        href={`/ofertas?page=${page - 1}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white dark:bg-surface-raised text-[#4A4A4A] dark:text-ink border border-[#EEE] dark:border-line hover:bg-primary hover:text-white hover:border-primary"
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
                        href={`/ofertas?page=${page + 1}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white dark:bg-surface-raised text-[#4A4A4A] dark:text-ink border border-[#EEE] dark:border-line hover:bg-primary hover:text-white hover:border-primary"
                        prefetch={false}
                      >
                        Siguiente
                      </Link>
                      <Link
                        href={`/ofertas?page=${totalPages}`}
                        className="px-4.5 py-2.5 rounded-[8px] no-underline text-[14px] font-medium transition-all duration-300 bg-white dark:bg-surface-raised text-[#4A4A4A] dark:text-ink border border-[#EEE] dark:border-line hover:bg-primary hover:text-white hover:border-primary"
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
              <h2 className="text-[#2D2D2D] dark:text-ink-strong mb-3 font-serif text-2xl">
                Próximamente
              </h2>
              <p className="text-[#6B6B6B] dark:text-ink-soft mb-6">
                Estamos preparando ofertas para esta sección.
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
