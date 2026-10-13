"use client"

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
]

const STOCK_OPTIONS = [
  { value: "", label: "Todos los stocks" },
  { value: "in_stock", label: "Con stock" },
  { value: "out_of_stock", label: "Agotados (stock 0)" },
]

const inputClass =
  "px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"

const labelClass = "text-[12px] text-[#9CA3B8] font-medium"

export function AdminProductFilters({
  q,
  categoryId,
  sort,
  stock,
  categories,
}: {
  q: string
  categoryId: string
  sort: string
  stock: string
  categories: { id: number; name: string }[]
}) {
  return (
    <form method="GET" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="apf-q" className={labelClass}>
          Buscar
        </label>
        <input
          id="apf-q"
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nombre o SKU..."
          className={`${inputClass} w-52 max-sm:w-full`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="apf-cat" className={labelClass}>
          Categoría
        </label>
        <select
          id="apf-cat"
          name="cat"
          defaultValue={categoryId}
          onChange={(e) => e.target.form?.submit()}
          className={inputClass}
        >
          <option value="">Todas</option>
          {(categories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="apf-sort" className={labelClass}>
          Ordenar por
        </label>
        <select
          id="apf-sort"
          name="sort"
          defaultValue={sort}
          onChange={(e) => e.target.form?.submit()}
          className={inputClass}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="apf-stock" className={labelClass}>
          Stock
        </label>
        <select
          id="apf-stock"
          name="stock"
          defaultValue={stock}
          onChange={(e) => e.target.form?.submit()}
          className={inputClass}
        >
          {STOCK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
        >
          Buscar
        </button>
        {q && (
          <a
            href="/admin/products"
            className="text-[#9CA3B8] hover:text-white text-[13px] no-underline transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>
    </form>
  )
}