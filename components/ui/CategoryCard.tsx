import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CategoryCardCategory {
  name: string
  slug: string
  image: string | null
  icon: string
  productCount: number
}

interface CategoryCardProps {
  category: CategoryCardCategory
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={`/categorias/${category.slug}`}
      className={cn(
        "bg-white rounded-[16px] no-underline transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(183,110,121,0.05)] overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(183,110,121,0.15)] hover:border-[rgb(251,132,150)] group",
        className,
      )}
    >
      <div className="relative h-40 overflow-hidden bg-[#FFFBF9]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-primary bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6]">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <h3 className="text-base font-sans font-semibold text-[rgb(154,90,99)] m-0">
          {category.name}
        </h3>
        <span className="text-[13px] text-[#888888] mt-1 block">
          {category.productCount} productos
        </span>
      </div>
    </Link>
  )
}
