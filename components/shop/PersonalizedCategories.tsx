"use client"

import { useCallback, useSyncExternalStore } from "react"
import { CategoryCard } from "@/components/ui/CategoryCard"

interface Category {
  name: string
  slug: string
  image: string | null
  icon: string
  productCount: number
}

interface PersonalizedCategoriesProps {
  categories: Category[]
}

const STORAGE_KEY = "liz_category_interactions"
const STORAGE_EVENT = "liz_categories:changed"
const MIN_INTERACTED_CATEGORIES = 2
const EMPTY: Record<string, number> = {}

let cache: { raw: string | null; value: Record<string, number> } = { raw: null, value: EMPTY }

function readInteractions(): Record<string, number> {
  if (typeof window === "undefined") return EMPTY
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw === cache.raw) return cache.value
  let value: Record<string, number> = EMPTY
  if (raw) {
    try {
      value = JSON.parse(raw)
    } catch {
      value = EMPTY
    }
  }
  cache = { raw, value }
  return value
}

function subscribeInteractions(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(STORAGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(STORAGE_EVENT, callback)
  }
}

function trackInteraction(slug: string) {
  const current = readInteractions()
  const next = { ...current, [slug]: (current[slug] ?? 0) + 1 }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
  }
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

function getTopCategories(categories: Category[], interactions: Record<string, number>): Category[] {
  const sorted = [...categories].sort((a, b) => (interactions[b.slug] ?? 0) - (interactions[a.slug] ?? 0))
  return sorted.slice(0, 2)
}

function getRemainingCategories(categories: Category[], topCategories: Category[]): Category[] {
  const topSlugs = new Set(topCategories.map(c => c.slug))
  return categories.filter(c => !topSlugs.has(c.slug))
}

export function PersonalizedCategories({ categories }: PersonalizedCategoriesProps) {
  const interactions = useSyncExternalStore(subscribeInteractions, readInteractions, () => EMPTY)

  const handleCategoryClick = useCallback((slug: string) => {
    trackInteraction(slug)
  }, [])

  const topCategories = getTopCategories(categories, interactions)
  const remainingCategories = getRemainingCategories(categories, topCategories)
  const interactedCount = categories.filter(c => (interactions[c.slug] ?? 0) > 0).length
  const hasPersonalization = interactedCount >= MIN_INTERACTED_CATEGORIES

  return (
    <section className="py-16 max-md:py-6 max-md:mb-4" id="categorias">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 max-md:hidden">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Categorías
          </div>
          <h2 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D] dark:text-ink-strong">
            El detalle que buscas
          </h2>
          <p className="text-[#6B6B6B] dark:text-ink-soft text-base max-w-[500px] mx-auto">
            Descubre piezas para cada ocasión y encuentra la que va contigo.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5 max-md:hidden">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} onClick={handleCategoryClick} />
          ))}
        </div>
        <div className="max-md:block hidden">
          <div className="mb-4">
            {hasPersonalization && (
              <h3 className="text-primary dark:text-ink-strong text-[13px] font-semibold uppercase tracking-[2px] mb-3 text-left">
                PARA TI
              </h3>
            )}
            <div className="grid grid-cols-2 gap-3">
              {topCategories.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  category={cat}
                  featured
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {remainingCategories.map((cat) => (
              <CategoryCard
                key={cat.slug}
                category={cat}
                compact
                onClick={handleCategoryClick}
                className="flex-shrink-0 w-[140px]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
