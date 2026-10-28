"use client"

import { useMemo, useState, useTransition } from "react"
import { addProductsToLiveSession } from "@/app/admin/lives/actions"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

export interface LivePickerProduct {
  id: number
  name: string
  price: number
  discount_price: number | null
  live_price: number | null
  stock: number
  categoryId: number
  categoryName: string
  image: string | null
}

export interface LivePickerCategory {
  id: number
  name: string
}

function formatPrice(value: number) {
  return `Bs. ${Number(value).toFixed(2)}`
}

function normalPrice(product: LivePickerProduct) {
  return Number(product.discount_price ?? product.price)
}

function validLivePrice(product: LivePickerProduct) {
  if (product.live_price === null) return null
  const value = Number(product.live_price)
  const normal = normalPrice(product)
  if (!Number.isFinite(value) || value < 0 || value >= normal) return null
  return value
}

function discountPercent(product: LivePickerProduct) {
  const live = validLivePrice(product)
  if (live === null) return null
  const normal = normalPrice(product)
  if (normal <= 0) return null
  return Math.round((1 - live / normal) * 100)
}

export function LiveProductPicker({
  liveSessionId,
  products,
  categories,
  existingProductIds,
  onAdded,
}: {
  liveSessionId: number
  products: LivePickerProduct[]
  categories: LivePickerCategory[]
  existingProductIds: number[]
  onAdded?: (added: number) => void
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const existingSet = useMemo(
    () => new Set(existingProductIds),
    [existingProductIds],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products.filter((product) => {
      if (category !== "all" && String(product.categoryId) !== category) {
        return false
      }
      if (term && !product.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [products, query, category])

  const selectableVisible = filtered.filter(
    (product) => !existingSet.has(product.id),
  )
  const allVisibleSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((product) => selected.has(product.id))

  const selectedProducts = products.filter((product) => selected.has(product.id))
  const selectedCount = selectedProducts.length

  function toggle(productId: number) {
    if (existingSet.has(productId)) return
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
    setError(null)
    setFeedback(null)
  }

  function toggleVisible() {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        selectableVisible.forEach((product) => next.delete(product.id))
      } else {
        selectableVisible.forEach((product) => next.add(product.id))
      }
      return next
    })
    setError(null)
    setFeedback(null)
  }

  function handleAdd() {
    if (isPending) return
    const ids = [...selected].filter((id) => !existingSet.has(id))
    if (ids.length === 0) {
      setError("Selecciona al menos un producto.")
      return
    }

    setError(null)
    setFeedback(null)

    startTransition(async () => {
      const result = await addProductsToLiveSession(liveSessionId, ids)
      if (result.error) {
        setError(result.error)
        return
      }

      setSelected(new Set())
      setFeedback(
        result.added > 0
          ? `${result.added} producto${result.added === 1 ? "" : "s"} agregado${
              result.added === 1 ? "" : "s"
            } al Modo Live.`
          : "Los productos seleccionados ya estaban en el Modo Live.",
      )
      if (result.added > 0) onAdded?.(result.added)
    })
  }

  return (
    <section className="rounded-[16px] border border-white/12 bg-[#1A1D24] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-white text-base font-bold">Agregar productos</h3>
          <p className="text-[11px] text-[#9CA3B8] mt-1">
            Selecciona varios productos y agrégalos en una sola operación. Se
            reutiliza el precio del Modo Live guardado de cada producto.
          </p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
          {selectedCount} seleccionado{selectedCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_190px]">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B8]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setError(null)
            }}
            placeholder="Buscar por nombre..."
            className="w-full rounded-xl border border-white/12 bg-[#2A2D35] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#6B7280] focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="sr-only">Filtrar por categoría</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setError(null)
            }}
            className="w-full rounded-xl border border-white/12 bg-[#2A2D35] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-[#9CA3B8]">
          {filtered.length} producto{filtered.length === 1 ? "" : "s"} visible
          {filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVisible}
            disabled={selectableVisible.length === 0}
            className="rounded-lg border-none bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#ABB2BF] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allVisibleSelected ? "Quitar visibles" : "Seleccionar visibles"}
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelected(new Set())
                setError(null)
              }}
              className="rounded-lg border-none bg-transparent px-2 py-1.5 text-[11px] font-semibold text-[#9CA3B8] transition-colors hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-[#9CA3B8]">
          No encontramos productos con ese filtro.
        </div>
      ) : (
        <div className="mt-3 grid max-h-[460px] grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {filtered.map((product) => {
            const isExisting = existingSet.has(product.id)
            const isSelected = selected.has(product.id)
            const live = validLivePrice(product)
            const discount = discountPercent(product)

            return (
              <label
                key={product.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#22252D] p-3 transition-colors",
                  isSelected
                    ? "border-primary/60 bg-primary/10"
                    : "hover:border-white/20",
                  isExisting && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isExisting}
                  onChange={() => toggle(product.id)}
                  className="sr-only"
                />
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#2A2D35]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-[#6B7280]">
                      Sin foto
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">
                        {product.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#9CA3B8]">
                        {product.categoryName} · Stock {product.stock}
                      </span>
                    </span>
                    {isExisting ? (
                      <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-[#ABB2BF]">
                        En el Live
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-white/25 bg-transparent",
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        )}
                      </span>
                    )}
                  </span>

                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="text-white">
                      Normal {formatPrice(normalPrice(product))}
                    </span>
                    {live !== null ? (
                      <span className="font-semibold text-primary">
                        Live {formatPrice(live)}
                      </span>
                    ) : (
                      <span className="text-[#C9A96E]">Sin precio del Modo Live</span>
                    )}
                    {discount !== null && discount > 0 && (
                      <span className="rounded bg-[#E74C3C] px-1.5 py-0.5 font-semibold text-white">
                        -{discount}%
                      </span>
                    )}
                    {product.live_price !== null && live === null && (
                      <span className="text-[#FF8A80]">
                        Precio guardado inválido
                      </span>
                    )}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mt-4 max-h-28 overflow-y-auto rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold text-primary">
            Seleccionados ({selectedCount})
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => toggle(product.id)}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/12 bg-[#2A2D35] px-2 py-1 text-[10px] text-[#D7DBE3] transition-colors hover:border-primary/50"
                aria-label={`Quitar ${product.name} de la selección`}
              >
                <span className="truncate">{product.name}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[11px] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="mt-3 text-[11px] text-[#7DDEA0]" role="status">
          {feedback}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] text-[#6B7280]">
          Los productos ya asociados no se duplican.
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAdd}
          disabled={isPending || selectedCount === 0}
        >
          {isPending
            ? "Agregando..."
            : selectedCount > 0
              ? `Agregar ${selectedCount} producto${selectedCount === 1 ? "" : "s"}`
              : "Agregar productos"}
        </Button>
      </div>
    </section>
  )
}
