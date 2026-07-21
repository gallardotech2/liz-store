"use client"

interface CatalogFiltersProps {
  categories: { name: string; slug: string }[]
  categorySlug: string
  sort: string
  q: string
}

export function CatalogFilters({ categories, categorySlug, sort, q }: CatalogFiltersProps) {
  return (
    <form
      method="GET"
      className="flex justify-between items-center mb-7.5 flex-wrap gap-4 p-5 bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-2.5">
        <label htmlFor="category" className="text-[14px] font-semibold">
          Categoría
        </label>
        <select
          name="category"
          id="category"
          onChange={(e) => e.target.form?.submit()}
          className="px-3.5 py-2 border border-[#DDD] rounded-[8px] text-[14px] font-sans focus:border-primary focus:outline-none"
        >
          <option value="">Todas</option>
          {(categories ?? []).map((cat) => (
            <option
              key={cat.slug}
              value={cat.slug}
              selected={categorySlug === cat.slug}
            >
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
          onChange={(e) => e.target.form?.submit()}
          className="px-3.5 py-2 border border-[#DDD] rounded-[8px] text-[14px] font-sans focus:border-primary focus:outline-none"
        >
          <option value="newest" selected={sort === "newest"}>Más recientes</option>
          <option value="price_asc" selected={sort === "price_asc"}>Menor precio</option>
          <option value="price_desc" selected={sort === "price_desc"}>Mayor precio</option>
          <option value="rating" selected={sort === "rating"}>Mejor calificados</option>
          <option value="name_asc" selected={sort === "name_asc"}>A-Z</option>
        </select>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar productos..."
          className="px-3.5 py-2 border border-[#DDD] rounded-[8px] text-[14px] font-sans min-w-[200px] focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 font-sans whitespace-nowrap no-underline cursor-pointer border-none px-5 py-2.5 text-xs bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_15px_rgba(255,142,159,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,142,159,0.4)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Buscar
        </button>
      </div>
    </form>
  )
}
