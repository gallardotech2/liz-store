import Link from "next/link"
import Image from "next/image"
import { cn, formatCurrency } from "@/lib/utils"

interface ProductCardProduct {
  id: number
  name: string
  slug: string
  price: number
  discountPrice: number | null
  rating: number
  ratingCount: number
  isNew: boolean
  isFeatured: boolean
  category: { name: string; slug: string }
  image: string | null
}

interface ProductCardProps {
  product: ProductCardProduct
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0
  const displayPrice = hasDiscount ? product.discountPrice! : product.price

  return (
    <div
      className={cn(
        "bg-white rounded-[16px] overflow-hidden transition-all duration-400 shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative border border-[rgba(183,110,121,0.05)] hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(183,110,121,0.15)] hover:border-[rgb(251,132,150)]",
        className,
      )}
    >
      {product.isNew && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className="badge-new inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-[#C9A96E] text-white">
            Nuevo
          </span>
          {hasDiscount && (
            <span className="badge-sale inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-primary text-white">
              -{discountPct}%
            </span>
          )}
        </div>
      )}
      {!product.isNew && hasDiscount && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className="badge-sale inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-primary text-white">
            -{discountPct}%
          </span>
        </div>
      )}

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 translate-x-2.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        <Link
          href="#"
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#4A4A4A] text-base shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-primary hover:text-white no-underline"
          title="Agregar al carrito"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </Link>
        <Link
          href={`/productos/${product.slug}`}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#4A4A4A] text-base shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-primary hover:text-white no-underline"
          title="Ver detalle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </Link>
      </div>

      <Link href={`/productos/${product.slug}`} className="no-underline">
        <div className="relative aspect-square overflow-hidden bg-[#FFFBF9]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)] text-4xl bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6]">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="text-[12px] text-[rgb(154,90,99)] uppercase tracking-[1px] font-semibold mb-1.5">
          {product.category.name}
        </div>
        <h3 className="text-base font-sans mb-2 leading-[1.4]">
          <Link
            href={`/productos/${product.slug}`}
            className="text-[#2D2D2D] no-underline transition-colors duration-300 hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && (
          <div className="flex items-center gap-1.5 text-[13px] mb-2.5">
            <span className="text-[#F4B740] tracking-[1px]">
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
            </span>
            <span className="text-[#888888]">({product.ratingCount})</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[22px] font-bold text-[rgb(154,90,99)] font-serif inline-flex items-center gap-0.5">
            {formatCurrency(displayPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-[#888888] line-through inline-flex items-center gap-0.5">
                {formatCurrency(product.price)}
              </span>
              <span className="text-[12px] text-white bg-[#E74C3C] px-2 py-0.5 rounded font-semibold">
                -{discountPct}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
