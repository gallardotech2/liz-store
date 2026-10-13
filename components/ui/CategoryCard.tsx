"use client"

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
  compact?: boolean
  featured?: boolean
  onClick?: (slug: string) => void
}

export function CategoryCard({ category, className, compact, featured, onClick }: CategoryCardProps) {
  const imageHeight = featured
    ? "h-28"
    : compact
      ? "h-28 max-md:h-28"
      : "h-40"

  const padding = featured
    ? "p-3"
    : compact
      ? "p-3 max-md:p-2.5"
      : "p-4"

  const titleSize = featured
    ? "text-sm"
    : compact
      ? "text-sm max-md:text-xs"
      : "text-base"

  const countSize = featured
    ? "text-[12px]"
    : compact
      ? "text-[11px] max-md:text-[10px]"
      : "text-[13px]"

  const isMobileVariant = featured || compact

  if (isMobileVariant) {
    return (
      <Link
        href={`/categorias/${category.slug}`}
        prefetch={false}
        onClick={onClick ? () => onClick(category.slug) : undefined}
        className={cn(
          "relative rounded-[16px] no-underline overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)] border border-[rgba(255,142,159,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(255,142,159,0.15)] hover:border-[rgb(251,132,150)] group",
          imageHeight,
          className,
        )}
      >
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes={compact ? "(max-width: 768px) 33vw, 140px" : "(max-width: 768px) 50vw, 220px"}
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-primary bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6] dark:to-surface">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center text-center p-2">
          <h3 className={cn(
            "font-serif text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] m-0",
            featured ? "text-lg" : "text-[15px]",
          )}>
            {category.name}
          </h3>
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/categorias/${category.slug}`}
      prefetch={false}
      onClick={onClick ? () => onClick(category.slug) : undefined}
      className={cn(
        "bg-white dark:bg-surface-raised rounded-[16px] no-underline transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)] border border-[rgba(255,142,159,0.05)] overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(255,142,159,0.15)] hover:border-[rgb(251,132,150)] group",
        className,
      )}
    >
      <div className={cn(
        "relative overflow-hidden bg-[#FFFBF9] dark:bg-surface",
        imageHeight,
      )}>
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-primary bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6] dark:to-surface">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
        )}
      </div>
      <div className={cn("text-center", padding)}>
        <h3 className={cn("font-sans font-semibold text-[rgb(154,90,99)] dark:text-primary m-0", titleSize)}>
          {category.name}
        </h3>
        <span className={cn("mt-1 block text-[#6B6B6B] dark:text-ink-soft", countSize)}>
          {category.productCount} productos
        </span>
      </div>
    </Link>
  )
}
