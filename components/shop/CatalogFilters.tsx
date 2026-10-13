"use client"

import Link from "next/link"
import { ProductSearchFields } from "./ProductSearch"

interface CatalogFiltersProps {
  categories: { name: string; slug: string }[]
  categorySlug: string
  sort: string
  q: string
}

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "rating", label: "Mejor calificados" },
  { value: "name_asc", label: "A-Z" },
]

const chipBase =
  "flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-medium border no-underline transition-colors duration-200"
const chipActive = "bg-primary text-white border-primary"
const chipInactive =
  "bg-white dark:bg-surface-raised text-[#4A4A4A] dark:text-ink border-[#EEE] dark:border-line"

export function CatalogFilters({ categories, categorySlug, sort, q }: CatalogFiltersProps) {
  const buildHref = (overrides: { category?: string; sort?: string }) => {
    const nextCategory = overrides.category ?? categorySlug
    const nextSort = overrides.sort ?? sort
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (nextCategory) sp.set("category", nextCategory)
    if (nextSort && nextSort !== "newest") sp.set("sort", nextSort)
    const s = sp.toString()
    return s ? `/productos?${s}` : "/productos"
  }

  return (
    <>
      {/* DESKTOP */}
      <form
        method="GET"
        className="max-md:hidden flex justify-between items-center mb-7.5 flex-wrap gap-4 p-5 bg-white dark:bg-surface-raised rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-2.5">
          <label htmlFor="category" className="text-[14px] font-semibold">
            Categoría
          </label>
          <select
            name="category"
            id="category"
            value={categorySlug}
            onChange={(e) => e.target.form?.submit()}
            className="px-3.5 py-2 border border-[#DDD] dark:border-line rounded-[8px] text-[14px] font-sans focus:border-primary focus:outline-none"
          >
            <option value="">Todas</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="sort" className="text-[14px] font-semibold">
            Ordenar por
          </label>
          <select
            name="sort"
            id="sort"
            value={sort}
            onChange={(e) => e.target.form?.submit()}
            className="px-3.5 py-2 border border-[#DDD] dark:border-line rounded-[8px] text-[14px] font-sans focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <ProductSearchFields defaultValue={q} inputClassName="min-w-[200px]" />
        </div>
      </form>

      {/* MÓVIL */}
      <div className="hidden max-md:block mb-6 -mx-4 px-4">
        <div className="mb-4">
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-[#6B6B6B] dark:text-ink-soft mb-2">
            Categorías
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <Link
              href={buildHref({ category: "" })}
              prefetch={false}
              className={`${chipBase} ${!categorySlug ? chipActive : chipInactive}`}
            >
              Todas
            </Link>
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={buildHref({ category: cat.slug })}
                prefetch={false}
                className={`${chipBase} ${categorySlug === cat.slug ? chipActive : chipInactive}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-[#6B6B6B] dark:text-ink-soft mb-2">
            Ordenar por
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref({ sort: opt.value })}
                prefetch={false}
                className={`${chipBase} ${sort === opt.value ? chipActive : chipInactive}`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
