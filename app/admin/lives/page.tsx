import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { LiveBadge } from "@/components/ui/LiveBadge"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { LiveElapsed } from "@/components/admin/LiveElapsed"
import { LiveEndScheduler } from "@/components/admin/LiveEndScheduler"
import { LiveExpirySync } from "@/components/admin/LiveExpirySync"
import { LiveModeStartForm } from "@/components/admin/LiveModeStartForm"
import { isHotSessionActive, isHotSessionExpired } from "@/lib/hot"
import { formatDateTime } from "@/lib/datetime"
import { cn } from "@/lib/utils"
import { endLiveSession, ensureLiveMode } from "./actions"
import {
  BoxIcon,
  BroadcastIcon,
  EyeIcon,
  PlayCircleIcon,
  StopIcon,
} from "@/components/admin/Icons"

export const revalidate = 0

interface DashboardProduct {
  id: number
  product_id: number
  promo_price: number | null
  status: string
  order: number | null
  shown_at: string | null
  products: {
    id: number
    name: string
    price: number
    discount_price: number | null
    live_price: number | null
    stock: number
    is_active: boolean
    product_images: Array<{ image: string; is_main: boolean }> | null
  } | null
}

interface DashboardSession {
  id: number
  title: string
  status: string
  is_global: boolean
  started_at: string | null
  ends_at: string | null
  ended_at: string | null
  ended_reason: string | null
  current_product_id: number | null
  live_products: DashboardProduct[] | null
}

const productStatusConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-[#27AE60]/15 text-[#27AE60]" },
  requested: { label: "Solicitado", color: "bg-[#C9A96E]/15 text-[#C9A96E]" },
  reserved: { label: "Reservado", color: "bg-[#03C9D7]/15 text-[#03C9D7]" },
  sold: { label: "Vendido", color: "bg-[#E74C3C]/15 text-[#E74C3C]" },
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function formatCurrency(value: number) {
  return `Bs. ${value.toFixed(2)}`
}

function livePrice(row: DashboardProduct) {
  if (row.promo_price === null) return null
  const normal = Number(
    row.products?.discount_price ?? row.products?.price ?? 0,
  )
  const promo = Number(row.promo_price)
  if (!Number.isFinite(promo) || promo < 0 || promo >= normal) return null
  return promo
}

export default async function AdminLivesPage() {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from("live_sessions")
    .select(`
      id,
      title,
      status,
      is_global,
      started_at,
      ends_at,
      ended_at,
      ended_reason,
      current_product_id,
      live_products(
        id,
        product_id,
        promo_price,
        status,
        "order",
        shown_at,
        products(
          id,
          name,
          price,
          discount_price,
          live_price,
          stock,
          is_active,
          product_images(image, is_main)
        )
      )
    `)
    .eq("is_global", true)
    .maybeSingle()

  if (error) {
    const missingFix = error.message?.includes("is_global")
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Modo Live</h1>
        <div className="mt-5 rounded-[16px] border border-[#C9A96E]/30 bg-[#C9A96E]/10 p-6">
          <h2 className="text-base font-bold text-[#C9A96E]">
            {missingFix
              ? "Falta aplicar la migración del Modo Live global"
              : "No se pudo cargar el Modo Live"}
          </h2>
          <p className="mt-2 text-sm text-[#D7DBE3]">
            {missingFix
              ? "Ejecuta Fix 0023 en el SQL Editor de Supabase para habilitar la configuración global persistente."
              : error.message}
          </p>
          {missingFix && (
            <p className="mt-2 text-[12px] text-[#9CA3B8]">
              El archivo pendiente está en{" "}
              <code className="rounded bg-black/20 px-1.5 py-0.5">
                supabase/sql/ejecucion.sql
              </code>
              .
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white m-0">Modo Live</h1>
            <LiveBadge label="MODO LIVE" />
          </div>
          <p className="mt-1 text-sm text-[#9CA3B8]">
            Configuración única y persistente para toda la tienda.
          </p>
        </div>
        <div className="rounded-[20px] border border-dashed border-white/15 bg-secondary-light px-6 py-12 text-center">
          <BroadcastIcon className="mx-auto mb-4 h-12 w-12 text-primary/40" />
          <h2 className="text-lg font-bold text-white">
            Modo Live sin configurar
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#9CA3B8]">
            La migración está aplicada, pero no existe la fila global. Crea la
            configuración persistente para comenzar.
          </p>
          <form action={ensureLiveMode} className="mt-5">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 border-none cursor-pointer"
            >
              <BroadcastIcon className="h-4 w-4" />
              Crear configuración Modo Live
            </button>
          </form>
        </div>
      </div>
    )
  }

  const session = data as DashboardSession
  const rawProducts = Array.isArray(session.live_products)
    ? session.live_products
    : []

  const catalog = rawProducts
    .map((row) => {
      const product = relation(row.products)
      const images = product?.product_images ?? []
      const mainImage = images.find((image) => image.is_main) ?? images[0]
      const normal = Number(product?.discount_price ?? product?.price ?? 0)
      return {
        ...row,
        product,
        image: mainImage?.image ?? null,
        normal,
        live: livePrice(row),
      }
    })
    .sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) || a.product_id - b.product_id,
    )

  const active = isHotSessionActive(session)
  const needsExpirySync = isHotSessionExpired(session)
  const expired =
    needsExpirySync ||
    (session.status === "ended" && session.ended_reason === "expired")
  const current =
    catalog.find((item) => item.product_id === session.current_product_id) ??
    catalog[0] ??
    null
  const productCount = catalog.length
  const currentProduct = current?.product ?? null
  const currentLive = current?.live ?? null
  const currentNormal = current?.normal ?? 0
  const shownCount = catalog.filter((item) => item.shown_at !== null).length
  const livePriceCount = catalog.filter((item) => item.live !== null).length

  const statusLabel = active
    ? "Activado"
    : expired
      ? "Finalizado por tiempo"
      : "Desactivado"

  const statusClass = active
    ? "bg-[#27AE60]/15 text-[#27AE60]"
    : expired
      ? "bg-[#E74C3C]/15 text-[#E74C3C]"
      : "bg-white/8 text-[#9CA3B8]"

  const displayProducts = catalog.slice(0, 6)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white m-0">Modo Live</h1>
            <LiveBadge label="MODO LIVE" />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[#9CA3B8]">
            Una sola configuración permanente. El catálogo, los precios y el
            orden se conservan aunque el Live esté desactivado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/lives/${session.id}/editar`}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white no-underline transition-colors hover:bg-white/10"
            prefetch={false}
          >
            Administrar catálogo
          </Link>
          <Link
            href={`/admin/lives/${session.id}/studio`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white no-underline transition-colors hover:bg-primary-dark"
            prefetch={false}
          >
            <BroadcastIcon className="h-4 w-4" />
            Abrir estudio
          </Link>
        </div>
      </div>

      <LiveExpirySync sessionId={session.id} expired={needsExpirySync} />

      <section
        className={cn(
          "overflow-hidden rounded-[20px] border p-5 sm:p-6",
          active
            ? "border-[#27AE60]/30 bg-gradient-to-r from-[#173026] via-[#1B2428] to-[#1A1D24]"
            : expired
              ? "border-[#E74C3C]/25 bg-gradient-to-r from-[#2A1D22] via-[#241F24] to-[#1A1D24]"
              : "border-white/12 bg-secondary-light",
        )}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <LiveBadge label="MODO LIVE" compact variant={active ? "solid" : "soft"} />
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                  statusClass,
                )}
              >
                {active ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                ) : expired ? (
                  <StopIcon className="h-3 w-3" />
                ) : (
                  <PlayCircleIcon className="h-3 w-3" />
                )}
                {statusLabel}
              </span>
            </div>
            <h2 className="mt-2 truncate text-xl font-bold text-white sm:text-2xl">
              {session.title}
            </h2>
            <p className="mt-1 text-[12px] text-[#9CA3B8]">
              {active
                ? "El Modo Live está visible en la tienda."
                : expired
                  ? "Venció por tiempo. El catálogo sigue guardado."
                  : "La tienda muestra su experiencia normal."}
            </p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-primary">
            <BroadcastIcon className="h-7 w-7" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
            <p className="text-[9px] uppercase tracking-[0.7px] text-[#6B7280]">
              Productos
            </p>
            <p className="mt-1 text-xl font-bold text-white">{productCount}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
            <p className="text-[9px] uppercase tracking-[0.7px] text-[#6B7280]">
              Con precio del Modo Live
            </p>
            <p className="mt-1 text-xl font-bold text-white">{livePriceCount}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
            <p className="text-[9px] uppercase tracking-[0.7px] text-[#6B7280]">
              En pantalla
            </p>
            <p className="mt-1 truncate text-sm font-bold text-white">
              {currentProduct?.name ?? "Sin producto"}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
            <p className="text-[9px] uppercase tracking-[0.7px] text-[#6B7280]">
              {active ? "Tiempo transcurrido" : "Última finalización"}
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {active ? (
                <LiveElapsed
                  startedAt={session.started_at}
                  active
                  className="tabular-nums"
                />
              ) : (
                formatDateTime(session.ended_at, "Sin activaciones")
              )}
            </p>
          </div>
        </div>

        {active && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#C9B8BB]">
            <span>
              Iniciado {formatDateTime(session.started_at)}{" "}
              <span className="text-[#6B7280]">({shownCount} mostrados)</span>
            </span>
            <span>
              {session.ends_at ? (
                <>
                  Termina en{" "}
                  <HotCountdown
                    endsAt={session.ends_at}
                    className="font-bold text-primary"
                  />
                </>
              ) : (
                "Sin límite de tiempo"
              )}
            </span>
          </div>
        )}

        {currentProduct && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 p-3">
            {current?.image ? (
              <img
                src={current.image}
                alt={currentProduct.name}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] text-[#6B7280]">
                Sin foto
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {currentProduct.name}
              </p>
              <p className="text-[11px] text-[#9CA3B8]">
                {currentLive !== null
                  ? `Live ${formatCurrency(currentLive)}`
                  : "Sin precio del Modo Live"}{" "}
                {currentNormal > 0 && (
                  <span className="text-[#6B7280] line-through">
                    {formatCurrency(currentNormal)}
                  </span>
                )}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
              En pantalla
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
          {active ? (
            <form action={endLiveSession.bind(null, session.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E74C3C]/25 bg-[#E74C3C]/15 px-4 py-2.5 text-xs font-bold text-[#E74C3C] transition-colors hover:bg-[#E74C3C]/25"
              >
                <StopIcon className="h-4 w-4" />
                Finalizar Modo Live
              </button>
            </form>
          ) : (
            <LiveModeStartForm
              sessionId={session.id}
              productCount={productCount}
              className="flex w-full flex-col gap-2 sm:w-auto"
            />
          )}
        </div>

        {active && (
          <div className="mt-4 rounded-xl border border-white/8 bg-black/10 p-3">
            <LiveEndScheduler
              sessionId={session.id}
              endsAt={session.ends_at}
            />
          </div>
        )}

        {!active && !expired && productCount === 0 && (
          <p className="mt-3 text-[11px] text-[#C9A96E]">
            Agrega productos al catálogo antes de activar el Modo Live.
          </p>
        )}
      </section>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[16px] border border-white/12 bg-secondary-light p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Catálogo configurado
              </h2>
              <p className="mt-0.5 text-[11px] text-[#9CA3B8]">
                Estos productos y precios se conservan entre activaciones.
              </p>
            </div>
            <Link
              href={`/admin/lives/${session.id}/editar`}
              className="shrink-0 text-[11px] font-semibold text-primary no-underline hover:underline"
              prefetch={false}
            >
              Ver todo
            </Link>
          </div>

          {catalog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center">
              <BoxIcon className="mx-auto mb-3 h-10 w-10 text-primary/30" />
              <p className="text-sm text-[#9CA3B8]">
                El catálogo del Modo Live está vacío.
              </p>
              <Link
                href={`/admin/lives/${session.id}/editar`}
                className="mt-3 inline-block text-xs font-semibold text-primary no-underline hover:underline"
                prefetch={false}
              >
                Agregar productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {displayProducts.map((item, index) => {
                const product = item.product
                const config =
                  productStatusConfig[item.status] ??
                  productStatusConfig.available
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#2A2D35] p-3"
                  >
                    <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#6B7280]">
                      {index + 1}
                    </span>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={product?.name ?? "Producto"}
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] text-[#6B7280]">
                        Sin foto
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {product?.name ?? "Producto"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {item.live !== null ? (
                          <span className="text-[11px] font-bold text-primary">
                            {formatCurrency(item.live)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#C9A96E]">
                            Sin precio del Modo Live
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-bold",
                            config.color,
                          )}
                        >
                          {config.label}
                        </span>
                        {item.product_id === current?.product_id && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                            En pantalla
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {catalog.length > displayProducts.length && (
            <p className="mt-3 text-[11px] text-[#9CA3B8]">
              +{catalog.length - displayProducts.length} producto
              {catalog.length - displayProducts.length === 1 ? "" : "s"} más en
              el catálogo.
            </p>
          )}
        </section>

        <aside className="rounded-[16px] border border-white/12 bg-secondary-light p-5">
          <h2 className="text-base font-bold text-white">Cómo funciona</h2>
          <div className="mt-3 space-y-3 text-[12px] text-[#9CA3B8]">
            <div className="flex gap-2.5">
              <EyeIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Al iniciar, la tienda muestra el producto en pantalla y el
                catálogo del Modo Live completo.
              </p>
            </div>
            <div className="flex gap-2.5">
              <PlayCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#27AE60]" />
              <p>
                Puedes finalizar manualmente o programar una fecha. La tienda
                vuelve a la normalidad automáticamente.
              </p>
            </div>
            <div className="flex gap-2.5">
              <BoxIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
              <p>
                Al finalizar no se borra nada. Productos, precios, orden y
                configuración quedan guardados para la próxima activación.
              </p>
            </div>
          </div>
          {session.ended_reason && !active && (
            <p className="mt-4 rounded-lg border border-white/8 bg-black/10 px-3 py-2 text-[11px] text-[#9CA3B8]">
              Último cierre:{" "}
              {session.ended_reason === "expired" ? "por tiempo" : "manual"} ·{" "}
              {formatDateTime(session.ended_at)}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
