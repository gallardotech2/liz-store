"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  BroadcastIcon,
  ArrowLeftIcon,
  PlayCircleIcon,
  StopIcon,
  EyeIcon,
  ShoppingBagIcon,
  HeartIcon,
} from "@/components/admin/Icons"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { HotPromoForm } from "@/components/admin/HotPromoForm"
import {
  LiveProductPicker,
  type LivePickerCategory,
  type LivePickerProduct,
} from "@/components/admin/LiveProductPicker"
import { LiveElapsed } from "@/components/admin/LiveElapsed"
import { LiveEndScheduler } from "@/components/admin/LiveEndScheduler"
import {
  startLiveMode,
  endLiveSession,
  moveLiveProduct,
  removeProductFromLiveSession,
  setCurrentLiveProduct,
  updateHotProductStatus,
} from "@/app/admin/lives/actions"
import { cn } from "@/lib/utils"
import type { LiveProductStatus } from "@/types/database"
import { isHotSessionExpired } from "@/lib/hot"
import { LiveBadge } from "@/components/ui/LiveBadge"

type SessionStatus = "not_started" | "live" | "paused" | "ended"

interface StudioProduct {
  id: number
  product_id: number
  status: LiveProductStatus
  order: number | null
  promo_price: number | null
  shown_at: string | null
  products: {
    id: number
    name: string
    price: number
    discount_price: number | null
    stock: number
    product_images: Array<{ image: string; is_main: boolean }> | null
  } | null
}

interface StudioSession {
  id: number
  title: string
  status: SessionStatus
  is_global: boolean
  started_at: string | null
  ends_at: string | null
  duration_hours: number | null
  ended_at: string | null
  ended_reason: "manual" | "expired" | null
  current_product_id: number | null
  live_products: StudioProduct[]
}

interface StudioPageProps {
  params: Promise<{ id: string }>
}

interface PickerProductRow {
  id: number
  name: string
  price: number
  discount_price: number | null
  live_price: number | null
  stock: number
  category_id: number
  category: { name: string } | Array<{ name: string }> | null
  product_images: Array<{ image: string; is_main: boolean }> | null
}

function toPickerProducts(rows: PickerProductRow[]): LivePickerProduct[] {
  return rows.map((product) => {
    const images = product.product_images ?? []
    const mainImage = images.find((image) => image.is_main) ?? images[0]
    const category = Array.isArray(product.category)
      ? product.category[0]
      : product.category

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      discount_price:
        product.discount_price !== null ? Number(product.discount_price) : null,
      live_price:
        product.live_price !== null ? Number(product.live_price) : null,
      stock: Number(product.stock ?? 0),
      categoryId: Number(product.category_id),
      categoryName: category?.name ?? "Sin categoría",
      image: mainImage?.image ?? null,
    }
  })
}

const productStatusConfig: Record<
  LiveProductStatus,
  { label: string; color: string }
> = {
  available: { label: "Disponible", color: "bg-[#27AE60]" },
  requested: { label: "Solicitado", color: "bg-[#C9A96E]" },
  reserved: { label: "Reservado", color: "bg-[#03C9D7]" },
  sold: { label: "Vendido", color: "bg-[#E74C3C]" },
}

function formatCurrency(amount: number) {
  return `Bs. ${Number(amount).toFixed(2)}`
}

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(value))
}

function getNormalPrice(product: StudioProduct) {
  if (!product.products) return null
  return Number(product.products.discount_price ?? product.products.price)
}

function getPromoPrice(product: StudioProduct) {
  if (product.promo_price === null) return null
  const value = Number(product.promo_price)
  return Number.isFinite(value) ? value : null
}

function isHotProduct(product: StudioProduct) {
  const normal = getNormalPrice(product)
  const promo = getPromoPrice(product)
  return normal !== null && promo !== null && promo < normal
}

function CampaignActions({
  session,
  busy,
  run,
  compact = false,
}: {
  session: StudioSession
  busy: string | null
  run: (key: string, action: () => Promise<void>) => Promise<void>
  compact?: boolean
}) {
  const buttonClass = compact
    ? "inline-flex items-center justify-center gap-1.5 rounded-lg border-none px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    : "w-full rounded-lg border-none py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
  const active = session.status === "live" && !isHotSessionExpired(session)

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
      {active ? (
        <button
          onClick={() => run("end", () => endLiveSession(session.id))}
          disabled={busy !== null}
          className={cn(
            buttonClass,
            "bg-[#E74C3C] text-white hover:bg-[#E74C3C]/90",
          )}
        >
          <StopIcon className="h-4 w-4" />
          Finalizar Modo Live
        </button>
      ) : (
        <button
          onClick={() => run("start", () => startLiveMode(session.id))}
          disabled={busy !== null || session.live_products.length === 0}
          className={cn(
            buttonClass,
            "bg-[#27AE60] text-white hover:bg-[#27AE60]/90",
          )}
        >
          <PlayCircleIcon className="h-4 w-4" />
          Iniciar Modo Live
        </button>
      )}

      {!active && session.live_products.length === 0 && (
        <p className="rounded-lg bg-[#C9A96E]/10 px-3 py-2 text-[11px] text-[#C9A96E]">
          Agrega al menos un producto para iniciar.
        </p>
      )}
    </div>
  )
}

export default function AdminLiveStudioPage({ params }: StudioPageProps) {
  const liveSessionId = Number(use(params).id)

  const [session, setSession] = useState<StudioSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productQuery, setProductQuery] = useState("")
  const [catalog, setCatalog] = useState<LivePickerProduct[]>([])
  const [categories, setCategories] = useState<LivePickerCategory[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [showAddProducts, setShowAddProducts] = useState(false)

  const fetchSession = useCallback(
    async (silent = false) => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await (supabase as any)
          .from("live_sessions")
          .select(`
            id,
            title,
            status,
            is_global,
            started_at,
            ends_at,
            duration_hours,
            ended_at,
            ended_reason,
            current_product_id,
            live_products(
              id,
              product_id,
              status,
              "order",
              promo_price,
              shown_at,
              products(
                id,
                name,
                price,
                discount_price,
                stock,
                product_images(image, is_main)
              )
            )
          `)
          .eq("id", liveSessionId)
          .single()

        if (fetchError) throw fetchError

        const sorted = {
          ...(data as StudioSession),
          live_products: [...((data as StudioSession).live_products ?? [])].sort(
            (a, b) =>
              (a.order ?? 0) - (b.order ?? 0) || a.product_id - b.product_id,
          ),
        }

        setSession(sorted)
        if (!silent) setError(null)
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el Modo Live",
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [liveSessionId],
  )

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)

    try {
      const supabase = createClient()
      const [productsResult, categoriesResult] = await Promise.all([
        (supabase as any)
          .from("products")
          .select(`
            id,
            name,
            price,
            discount_price,
            live_price,
            stock,
            category_id,
            category:categories(id, name),
            product_images(image, is_main)
          `)
          .eq("is_active", true)
          .order("name"),
        (supabase as any)
          .from("categories")
          .select("id, name")
          .order("name"),
      ])

      if (productsResult.error) throw productsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      setCatalog(
        toPickerProducts((productsResult.data ?? []) as PickerProductRow[]),
      )
      setCategories(
        (categoriesResult.data ?? []) as LivePickerCategory[],
      )
    } catch (err) {
      setCatalogError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el catálogo de productos.",
      )
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadCatalog()
    }, 0)
    return () => window.clearTimeout(initial)
  }, [loadCatalog])

  useEffect(() => {
    const initial = window.setTimeout(() => fetchSession(), 0)

    let interval: ReturnType<typeof setInterval> | null = null
    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    const start = () => {
      if (interval) return
      interval = setInterval(() => {
        if (document.visibilityState === "visible") fetchSession(true)
      }, 30000)
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSession(true)
        start()
      } else {
        stop()
      }
    }

    start()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.clearTimeout(initial)
      stop()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchSession])

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await action()
      await fetchSession(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar la acción",
      )
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <BroadcastIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl text-[#9CA3B8]">Modo Live no encontrado</h2>
        {error && <p className="text-sm text-[#E74C3C] mt-2">{error}</p>}
        <Link
          href="/admin/lives"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Volver al Modo Live
        </Link>
      </div>
    )
  }

  if (!session.is_global) {
    return (
      <div className="text-center py-20">
        <BroadcastIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl text-[#9CA3B8]">
          Esta configuración no es el Modo Live global
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#9CA3B8]">
          El Modo Live actual es único y persistente para toda la tienda.
        </p>
        <Link
          href="/admin/lives"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Ir al Modo Live
        </Link>
      </div>
    )
  }

  const products = session.live_products
  const current =
    products.find((product) => product.product_id === session.current_product_id) ??
    null
  const currentHot = current ? isHotProduct(current) : false
  const currentPromo = current ? getPromoPrice(current) : null
  const currentNormal = current ? getNormalPrice(current) : null

  const expired =
    isHotSessionExpired(session) ||
    (session.status === "ended" && session.ended_reason === "expired")
  const active = session.status === "live" && !expired

  const shownCount = products.filter((product) => product.shown_at !== null).length
  const availableCount = products.filter(
    (product) => product.status === "available",
  ).length
  const requestedCount = products.filter(
    (product) => product.status === "requested",
  ).length
  const soldCount = products.filter((product) => product.status === "sold").length

  const selectableProducts = products.filter((product) => {
    if (product.product_id === session.current_product_id) return true
    if (!isHotProduct(product)) return false
    if ((product.products?.stock ?? 0) <= 0) return false
    return product.status === "available" || product.status === "requested"
  })

  const filteredProducts = products.filter((product) => {
    const term = productQuery.trim().toLowerCase()
    if (!term) return true
    return (product.products?.name ?? "").toLowerCase().includes(term)
  })

  const statusLabel =
    session.status === "live" && !expired
      ? "MODO LIVE ACTIVO"
      : expired
        ? "FINALIZADO POR TIEMPO"
        : "DESACTIVADO"

  const statusClass =
    session.status === "live" && !expired
      ? "bg-[#27AE60]/20 text-[#27AE60]"
      : expired
        ? "bg-[#E74C3C]/20 text-[#E74C3C]"
        : "bg-white/10 text-[#9CA3B8]"

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-40 bg-secondary-light border-b border-white/12 px-7 py-4 flex items-center justify-between gap-4 max-md:px-4 max-md:flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/lives"
            className="flex items-center gap-2 text-[#ABB2BF] hover:text-white transition-colors no-underline"
            prefetch={false}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium max-sm:hidden">Modo Live</span>
          </Link>
          <span className="text-white/20 max-sm:hidden">|</span>
          <span className="text-[#ABB2BF] truncate max-w-[280px]">
            {session.title}
          </span>
          <LiveBadge compact variant="soft" label="MODO LIVE" className="max-sm:hidden" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.5px]",
              statusClass,
            )}
          >
            {statusLabel}
          </span>
          {active && session.ends_at && (
            <span className="text-[12px] text-[#9CA3B8]">
              Termina en{" "}
              <HotCountdown
                endsAt={session.ends_at}
                className="font-bold text-white"
              />
            </span>
          )}
          <Link
            href={`/admin/lives/${session.id}/editar`}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors no-underline"
            prefetch={false}
          >
            Administrar catálogo
          </Link>
        </div>
      </header>

      <div className="border-b border-white/12 bg-secondary-light px-4 py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[#9CA3B8]">
            Acciones rápidas
          </span>
          <Link
            href={`/admin/lives/${session.id}/editar`}
            className="text-[11px] font-semibold text-primary no-underline"
            prefetch={false}
          >
            Administrar catálogo
          </Link>
        </div>
        <CampaignActions
          session={session}
          busy={busy}
          run={run}
          compact
        />
      </div>

      <main className="p-7 max-md:p-5 max-sm:p-3 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <section className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-4 py-3 text-sm text-[#E74C3C]">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddProducts((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-lg border-none bg-primary/15 px-3.5 py-2 text-[11px] font-bold text-primary transition-colors hover:bg-primary/25"
            >
              <BroadcastIcon className="h-3.5 w-3.5" />
              {showAddProducts ? "Cerrar catálogo" : "Agregar productos"}
            </button>
          </div>

          {showAddProducts && (
            <div className="flex flex-col gap-2">
              {catalogLoading ? (
                <div className="rounded-xl border border-white/12 bg-secondary-light px-4 py-6 text-center text-sm text-[#9CA3B8]">
                  Cargando catálogo...
                </div>
              ) : catalogError ? (
                <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-4 py-3 text-sm text-[#E74C3C]">
                  {catalogError}
                </div>
              ) : (
                <LiveProductPicker
                  liveSessionId={session.id}
                  products={catalog}
                  categories={categories}
                  existingProductIds={products.map((product) => product.product_id)}
                  onAdded={() => {
                    void fetchSession(true)
                    void loadCatalog()
                  }}
                />
              )}
            </div>
          )}

          <div
            className={cn(
              "aspect-video rounded-[16px] overflow-hidden bg-[#1A1D24] relative",
              session.status === "live" && !expired && "ring-2 ring-primary",
            )}
          >
            {session.status === "live" && !expired && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#E74C3C] text-white px-3 py-1 rounded-full text-[12px] font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                EN PANTALLA
              </div>
            )}

            {current ? (
              <div className="w-full h-full flex flex-col">
                <div className="relative flex-1 bg-[#1A1D24]">
                  {current.products?.product_images?.[0] && (
                    <img
                      src={current.products.product_images[0].image}
                      alt={current.products?.name ?? "Producto"}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-bold text-white",
                          productStatusConfig[current.status].color,
                        )}
                      >
                        {productStatusConfig[current.status].label}
                      </span>
                      {currentHot && currentPromo !== null ? (
                        <span className="text-[#F5B7B1] font-bold text-lg">
                          Modo Live {formatCurrency(currentPromo)}
                        </span>
                      ) : (
                        <span className="text-[#C9A96E] text-sm font-semibold">
                          Sin precio del Modo Live
                        </span>
                      )}
                      {currentNormal !== null && (
                        <span className="text-white/60 text-sm line-through">
                          {formatCurrency(currentNormal)}
                        </span>
                      )}
                      {currentHot &&
                        currentPromo !== null &&
                        currentNormal !== null &&
                        currentNormal > 0 && (
                          <span className="rounded bg-[#E74C3C] px-2 py-0.5 text-[10px] font-bold text-white">
                            -
                            {Math.round(
                              (1 - currentPromo / currentNormal) * 100,
                            )}
                            %
                          </span>
                        )}
                    </div>
                    <h3 className="text-white text-xl font-bold">
                      {current.products?.name ?? "Producto"}
                    </h3>
                    <p className="text-white/60 text-xs mt-1">
                      Stock: {current.products?.stock ?? 0}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-secondary-light border-t border-white/12 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(
                      Object.keys(productStatusConfig) as LiveProductStatus[]
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          run(`status-${current.product_id}-${status}`, () =>
                            updateHotProductStatus(
                              session.id,
                              current.product_id,
                              status,
                            ),
                          )
                        }
                        disabled={busy !== null}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border-none cursor-pointer disabled:opacity-50",
                          current.status === status
                            ? `${productStatusConfig[status].color} text-white`
                            : "bg-white/5 text-[#ABB2BF] hover:bg-white/10",
                        )}
                      >
                        {productStatusConfig[status].label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      run("clear-current", () =>
                        setCurrentLiveProduct(session.id, null),
                      )
                    }
                    disabled={busy !== null}
                    className="px-4 py-2 rounded-lg bg-[#2A2D35] text-white text-sm font-semibold hover:bg-white/10 transition-colors border-none cursor-pointer disabled:opacity-50"
                  >
                    Quitar de pantalla
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3B8] px-6 text-center">
                <BroadcastIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">
                  {session.status === "live" && !expired
                    ? "Selecciona un producto para mostrar en pantalla"
                    : "No hay producto en pantalla"}
                </p>
                <p className="text-sm mt-1">
                  Usa el panel lateral para elegir un producto del Modo Live.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <BroadcastIcon className="w-4 h-4" />
                <span>Productos</span>
              </div>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                {products.length}
              </div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <EyeIcon className="w-4 h-4" />
                <span>Mostrados</span>
              </div>
              <div className="text-2xl font-bold text-white sm:text-3xl">{shownCount}</div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <HeartIcon className="w-4 h-4" />
                <span>Solicitados</span>
              </div>
              <div className="text-2xl font-bold text-[#C9A96E] sm:text-3xl">
                {requestedCount}
              </div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-3 sm:p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <ShoppingBagIcon className="w-4 h-4" />
                <span>Vendidos</span>
              </div>
              <div className="text-2xl font-bold text-[#27AE60] sm:text-3xl">{soldCount}</div>
            </div>
          </div>

          <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-3">
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-4">
              <div className="text-[11px] uppercase tracking-[1px] text-[#9CA3B8] mb-1">
                Iniciada
              </div>
              <div className="text-sm text-white">
                {formatDateTime(session.started_at)}
              </div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-4">
              <div className="text-[11px] uppercase tracking-[1px] text-[#9CA3B8] mb-1">
                Termina
              </div>
              <div className="text-sm text-white">
                {formatDateTime(session.ends_at)}
              </div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-4">
              <div className="text-[11px] uppercase tracking-[1px] text-[#9CA3B8] mb-1">
                Transcurrido
              </div>
              <div className="text-sm text-white">
                <LiveElapsed
                  startedAt={session.started_at}
                  active={session.status === "live" && !expired}
                  inactiveLabel="—"
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
            <h3 className="text-white font-bold mb-4">Producto en pantalla</h3>
            <select
              value={current?.product_id ?? ""}
              onChange={(event) =>
                run("set-current", () =>
                  setCurrentLiveProduct(
                    session.id,
                    event.target.value ? Number(event.target.value) : null,
                  ),
                )
              }
              disabled={busy !== null}
              className="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
            >
              <option value="">— Sin producto —</option>
              {selectableProducts.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.products?.name ?? `Producto ${product.product_id}`}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#9CA3B8] mt-2 leading-[1.5]">
              Solo aparecen productos con precio del Modo Live, stock disponible y estado
              disponible o solicitado.
            </p>
            {selectableProducts.length === 0 && (
              <p className="text-[11px] text-[#C9A96E] mt-2">
                No hay productos válidos. Agrega un producto con precio del Modo Live
                desde el catálogo.
              </p>
            )}
          </div>

          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Productos</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProducts(true)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="rounded-lg border-none bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/25"
                >
                  Agregar
                </button>
                <span className="text-[10px] bg-[#C9A96E] text-white px-1.5 py-0.5 rounded font-semibold">
                  {products.length}
                </span>
              </div>
            </div>

            <div className="relative mb-3">
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
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Buscar en el catálogo del Modo Live..."
                className="w-full rounded-lg border border-white/12 bg-[#1A1D24] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#6B7280] focus:border-primary"
              />
            </div>

            <div className="space-y-2 max-h-[52vh] overflow-y-auto sm:max-h-[520px]">
              {filteredProducts.map((product) => {
                const isCurrent =
                  product.product_id === session.current_product_id
                const promo = getPromoPrice(product)
                const normal = getNormalPrice(product)
                const productHot = isHotProduct(product)
                const discountPct =
                  productHot && promo !== null && normal !== null && normal > 0
                    ? Math.round((1 - promo / normal) * 100)
                    : null
                const config =
                  productStatusConfig[product.status] ??
                  productStatusConfig.available
                const productIndex = products.findIndex(
                  (item) => item.product_id === product.product_id,
                )
                const isFirst = productIndex <= 0
                const isLast = productIndex === products.length - 1
                const canShow =
                  !isCurrent &&
                  productHot &&
                  (product.products?.stock ?? 0) > 0 &&
                  (product.status === "available" ||
                    product.status === "requested")

                return (
                  <div
                    key={product.product_id}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      isCurrent
                        ? "bg-primary/10 border-primary/30"
                        : "bg-[#2A2D35] border-white/12 hover:border-primary/20",
                    )}
                  >
                    <div className="flex items-start gap-3 max-sm:flex-wrap">
                      {product.products?.product_images?.[0] ? (
                        <img
                          src={product.products.product_images[0].image}
                          alt={product.products?.name ?? "Producto"}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] text-[#6B7280]">
                          Sin foto
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {product.products?.name ?? "Producto"}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white shrink-0">
                              EN PANTALLA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#ABB2BF] flex-wrap">
                          <span className="text-[10px] font-bold text-[#6B7280]">
                            #{productIndex + 1}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold text-white",
                              config.color,
                            )}
                          >
                            {config.label}
                          </span>
                          {productHot && promo !== null ? (
                            <span className="text-[#F5B7B1] font-semibold">
                              Modo Live {formatCurrency(promo)}
                            </span>
                          ) : (
                            <span className="text-[#C9A96E]">
                              Sin precio del Modo Live
                            </span>
                          )}
                          {normal !== null && (
                            <span className="text-[#6B7280] line-through">
                              {formatCurrency(normal)}
                            </span>
                          )}
                          {discountPct !== null && discountPct > 0 && (
                            <span className="rounded bg-[#E74C3C] px-1 py-0.5 text-[9px] font-bold text-white">
                              -{discountPct}%
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">
                          Stock: {product.products?.stock ?? 0}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-end">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              run(`move-up-${product.product_id}`, () =>
                                moveLiveProduct(
                                  session.id,
                                  product.product_id,
                                  "up",
                                ),
                              )
                            }
                            disabled={busy !== null || isFirst}
                            aria-label="Subir producto"
                            className="rounded bg-white/5 px-2 py-1 text-[11px] font-bold text-[#ABB2BF] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              run(`move-down-${product.product_id}`, () =>
                                moveLiveProduct(
                                  session.id,
                                  product.product_id,
                                  "down",
                                ),
                              )
                            }
                            disabled={busy !== null || isLast}
                            aria-label="Bajar producto"
                            className="rounded bg-white/5 px-2 py-1 text-[11px] font-bold text-[#ABB2BF] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                        {canShow && (
                          <button
                            onClick={() =>
                              run(`show-${product.product_id}`, () =>
                                setCurrentLiveProduct(
                                  session.id,
                                  product.product_id,
                                ),
                              )
                            }
                            disabled={busy !== null}
                            className="px-2 py-1 rounded bg-primary/15 text-primary text-[11px] font-semibold hover:bg-primary/25 transition-colors border-none cursor-pointer disabled:opacity-50"
                          >
                            Mostrar
                          </button>
                        )}
                        {isCurrent && (
                          <button
                            onClick={() =>
                              run("clear-current", () =>
                                setCurrentLiveProduct(session.id, null),
                              )
                            }
                            disabled={busy !== null}
                            className="px-2 py-1 rounded bg-white/10 text-white text-[11px] font-semibold hover:bg-white/20 transition-colors border-none cursor-pointer disabled:opacity-50"
                          >
                            Quitar de pantalla
                          </button>
                        )}
                        <select
                          value={product.status}
                          onChange={(event) =>
                            run(
                              `status-${product.product_id}-${event.target.value}`,
                              () =>
                                updateHotProductStatus(
                                  session.id,
                                  product.product_id,
                                  event.target.value as LiveProductStatus,
                                ),
                            )
                          }
                          disabled={busy !== null}
                          className="px-2 py-1 rounded bg-[#1A1D24] border border-white/12 text-white text-[11px] outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="available">Disponible</option>
                          <option value="requested">Solicitado</option>
                          <option value="reserved">Reservado</option>
                          <option value="sold">Vendido</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/8 pt-2">
                      <HotPromoForm
                        liveSessionId={session.id}
                        productId={product.product_id}
                        productName={product.products?.name ?? "Producto"}
                        normalPrice={normal ?? 0}
                        initialPromo={product.promo_price}
                        onSaved={() => fetchSession(true)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "¿Quitar este producto del catálogo del Modo Live? No se eliminará del catálogo general.",
                            )
                          ) {
                            return
                          }
                          void run(`remove-${product.product_id}`, () =>
                            removeProductFromLiveSession(
                              session.id,
                              product.product_id,
                            ),
                          )
                        }}
                        disabled={busy !== null}
                        className="rounded-lg border-none bg-transparent px-2 py-1.5 text-[10px] font-semibold text-[#E74C3C] transition-colors hover:bg-[#E74C3C]/10 disabled:opacity-50"
                      >
                        Quitar del catálogo del Modo Live
                      </button>
                    </div>
                  </div>
                )
              })}

              {products.length === 0 && (
                <div className="text-center py-8 text-[#9CA3B8]">
                  <BroadcastIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay productos en el catálogo del Modo Live</p>
                  <button
                    type="button"
                    onClick={() => setShowAddProducts(true)}
                    className="text-xs mt-1 inline-block border-none bg-transparent text-primary hover:underline"
                  >
                    Agregar productos
                  </button>
                </div>
              )}

              {products.length > 0 && filteredProducts.length === 0 && (
                <div className="py-8 text-center text-[#9CA3B8]">
                  <p className="text-sm">Sin resultados para “{productQuery}”.</p>
                  <button
                    onClick={() => setProductQuery("")}
                    className="mt-1 border-none bg-transparent text-xs text-primary hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
            <h3 className="text-white font-bold mb-4">Modo Live</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3B8]">Disponibles</span>
                <span className="text-white font-semibold">
                  {availableCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3B8]">Solicitados</span>
                <span className="text-[#C9A96E] font-semibold">
                  {requestedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3B8]">Vendidos</span>
                <span className="text-[#27AE60] font-semibold">{soldCount}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-white/12 pt-4">
              <CampaignActions
                session={session}
                busy={busy}
                run={run}
              />
            </div>

            {active && (
              <div className="mt-4 border-t border-white/12 pt-4">
                <LiveEndScheduler
                  sessionId={session.id}
                  endsAt={session.ends_at}
                  onSaved={() => fetchSession(true)}
                />
              </div>
            )}

            {session.ended_reason && (
              <p className="text-[11px] text-[#9CA3B8] mt-3">
                Motivo de cierre:{" "}
                {session.ended_reason === "expired" ? "vencida" : "manual"}
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
