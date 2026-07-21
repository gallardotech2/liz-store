import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/Button"
import { ProductCard } from "@/components/ui/ProductCard"
import { CategoryCard } from "@/components/ui/CategoryCard"
import { formatCurrency } from "@/lib/utils"
import { FaWhatsapp, FaTiktok, FaInstagram, FaShieldAlt, FaTruck, FaGem, FaHeart } from "react-icons/fa"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()
  const s = supabase as any

  const [categoriesResult, featuredResult, newResult, testimonialsResult, storeProfileResult, productCounts] =
    await Promise.all([
      s.from("categories").select("*").eq("is_active", true).order("order"),
      s
        .from("products")
        .select("id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug), product_images(image, is_main)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8),
      s
        .from("products")
        .select("id, name, slug, price, discount_price, rating, rating_count, is_new, is_featured, category:categories(id, name, slug), product_images(image, is_main)")
        .eq("is_active", true)
        .eq("is_new", true)
        .limit(8),
      s.from("reviews").select("id, rating, content").eq("is_approved", true).limit(6),
      s.from("store_profiles").select("*").maybeSingle(),
      s.from("products").select("category_id").eq("is_active", true),
    ])

  type RawCategory = {
    id: number
    name: string
    slug: string
    image: string | null
    icon: string
  }
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

  const countMap = new Map<number, number>()
  for (const p of (productCounts.data ?? []) as Array<{ category_id: number }>) {
    countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1)
  }

  const categories = ((categoriesResult.data ?? []) as RawCategory[]).map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.image,
    icon: c.icon,
    productCount: countMap.get(c.id) ?? 0,
  }))

  const getMainImage = (p: RawProduct): string | null => {
    const images = p.product_images
    const main = images?.find((img) => img.is_main) ?? images?.[0]
    return main?.image ?? null
  }

  const mapProduct = (p: RawProduct) => {
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
  }

  const featuredProducts = ((featuredResult.data ?? []) as RawProduct[]).map(mapProduct)
  const newProducts = ((newResult.data ?? []) as RawProduct[]).map(mapProduct)

  const testimonials = (testimonialsResult.data ?? []) as { id: number; rating: number; content: string }[]
  const storeProfile = storeProfileResult.data

  return (
    <>
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-[#FDF8F6] via-[#F5E6E8] to-[#FDF8F6] overflow-hidden">
        <div className="absolute -top-1/2 -right-1/5 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,142,159,0.08)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute -bottom-1/3 -left-1/10 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,169,110,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap w-full">
          <div className="relative z-10 max-w-[600px] py-15 px-5 max-md:p-5 max-md:text-center">
            <div className="flex items-center gap-2 mb-4 flex-wrap max-md:justify-center">
              <span className="text-[13px] font-bold tracking-[1px] text-primary">
                REDES LIZ
              </span>
              <a
                href="#"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] text-white no-underline transition-transform duration-300 hover:scale-110"
                style={{ background: "#25D366" }}
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="text-[18px] flex-shrink-0" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white no-underline transition-transform duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <FaTiktok className="text-[18px] flex-shrink-0" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-8 h-8 rounded-full text-white no-underline transition-transform duration-300 hover:scale-110"
                style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}
                aria-label="Instagram"
              >
                <FaInstagram className="text-[18px] flex-shrink-0" />
              </a>
            </div>
            <h1 className="text-[clamp(36px,5vw,64px)] leading-[1.1] mb-5 text-[#2D2D2D] font-serif">
              Bisutería con <span className="text-primary">Estilo</span>,<br />
              Confianza <span className="text-primary">Elegante</span>
            </h1>
            <p className="text-lg text-[#888888] mb-9 leading-[1.8] max-w-[480px] max-md:mx-auto">
              Descubre accesorios que realzan tu belleza. Cada pieza está seleccionada para ti.
            </p>
            <div className="flex gap-4 flex-wrap max-md:justify-center">
              <Link href="/productos">
                <Button variant="primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  Ver catálogo
                </Button>
              </Link>
              <Link href="#categorias">
                <Button variant="secondary">Explorar categorías</Button>
              </Link>
            </div>
          </div>
          <div className="relative z-10 flex-1 flex justify-center items-center p-10 max-md:p-0">
            <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
              <Image
                src="https://i.pinimg.com/736x/43/fd/13/43fd130b0822988b8c7700611cc6100a.jpg"
                alt="Bisutería elegante"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-20" id="categorias">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Categorías
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Explora por categoría
              </h2>
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                Descubre nuestra colección organizada para encontrar tu estilo perfecto.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
              {categories.map((cat) => (
                <CategoryCard key={cat.slug} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Destacados
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Los más vendidos
              </h2>
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                Nuestros clientes aman estas piezas. Tú también las amarás.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-md:gap-3.75">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/productos?sort=rating">
                <Button variant="secondary">Ver todos los productos</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {newProducts.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Novedades
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Recién llegados
              </h2>
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                Las últimas tendencias en bisutería que debes tener.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-md:gap-3.75">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Testimonios
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Lo que dicen nuestras clientas
              </h2>
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                Mujeres reales, resultados reales. Su satisfacción es nuestra mejor carta de presentación.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
              {testimonials.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(255,142,159,0.05)] transition-all duration-300 hover:shadow-[0_4px_15px_rgba(255,142,159,0.12)] hover:border-[rgb(251,132,150)]"
                >
                  <div className="text-[#F4B740] text-lg mb-3 tracking-[1px]">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                  <p className="text-[15px] leading-[1.8] text-[#4A4A4A] mb-5 italic">
                    &ldquo;{review.content?.split(" ").slice(0, 30).join(" ")}{review.content && review.content.split(" ").length > 30 ? "..." : ""}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[rgb(251,132,150)] to-[#D4A5A5] flex items-center justify-center text-primary font-semibold text-lg">
                      C
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#2D2D2D]">
                        Cliente verificado
                      </div>
                      <div className="text-[12px] text-[#888888]">
                        Compra verificada
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-15 border-t border-[rgba(255,142,159,0.1)] border-b border-[rgba(255,142,159,0.1)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-7.5 text-center">
            {ESCUDO_PAGO_ENABLED && (
              <div className="p-5 flex flex-col items-center">
                <div className="text-primary mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(255,142,159,0.08)]">
                  <FaShieldAlt className="text-[26px]" />
                </div>
                <h4 className="font-sans text-base mb-2 text-[#2D2D2D]">Escudo Pago</h4>
                <p className="text-sm text-[#888888] leading-[1.6]">
                  Tu dinero protegido hasta recibir tu pedido. Paga con total confianza.
                </p>
              </div>
            )}
            <div className="p-5 flex flex-col items-center">
              <div className="text-primary mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(255,142,159,0.08)]">
                <FaTruck className="text-[26px]" />
              </div>
              <h4 className="font-sans text-base mb-2 text-[#2D2D2D]">Envío Seguro</h4>
              <p className="text-sm text-[#888888] leading-[1.6]">
                Empaquetamos con amor. Envíos rápidos a todo el país.
              </p>
            </div>
            <div className="p-5 flex flex-col items-center">
              <div className="text-primary mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(255,142,159,0.08)]">
                <FaGem className="text-[26px]" />
              </div>
              <h4 className="font-sans text-base mb-2 text-[#2D2D2D]">Calidad Premium</h4>
              <p className="text-sm text-[#888888] leading-[1.6]">
                Solo trabajamos con materiales que realzan tu belleza natural.
              </p>
            </div>
            <div className="p-5 flex flex-col items-center">
              <div className="text-primary mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(255,142,159,0.08)]">
                <FaHeart className="text-[26px]" />
              </div>
              <h4 className="font-sans text-base mb-2 text-[#2D2D2D]">Amor al Detalle</h4>
              <p className="text-sm text-[#888888] leading-[1.6]">
                Cada pieza es seleccionada cuidadosamente para ti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {ESCUDO_PAGO_ENABLED && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
                Escudo Pago
              </div>
              <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
                Tu dinero está protegido
              </h2>
              <p className="text-[#888888] text-base max-w-[500px] mx-auto">
                Solo se libera cuando confirmes que recibiste tu pedido.
              </p>
            </div>
            <div className="max-w-[600px] mx-auto text-center">
              <div className="text-[72px] text-primary mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <p className="text-lg leading-[1.8] text-[#888888] mb-7.5">
                Con <strong>Escudo Pago</strong> tu compra está completamente protegida. El vendedor recibe el pago solo hasta que tú confirmes que recibiste tu producto en perfectas condiciones.
              </p>
              <Link href="/faq">
                <Button variant="primary">Más información</Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
