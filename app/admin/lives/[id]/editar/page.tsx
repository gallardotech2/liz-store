import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { HotPromoForm } from "@/components/admin/HotPromoForm"
import { LiveProductStatusSelect } from "@/components/admin/LiveProductStatusSelect"
import {
  LiveProductPicker,
  type LivePickerProduct,
} from "@/components/admin/LiveProductPicker"
import { LiveBadge } from "@/components/ui/LiveBadge"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { isHotSessionActive, isHotSessionExpired } from "@/lib/hot"
import { cn } from "@/lib/utils"
import {
  moveLiveProduct,
  removeProductFromLiveSession,
  setCurrentLiveProduct,
  updateLiveModeTitle,
} from "../../actions"
import {
  ArrowLeftIcon,
  BroadcastIcon,
  StopIcon,
} from "@/components/admin/Icons"
import type { LiveProductStatus } from "@/types/database"

export const revalidate = 0

interface LiveSessionPageProps {
  params: Promise<{ id: string }>
}

interface EditableProductRow {
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

interface EditableSessionProduct {
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
    is_active: boolean
    product_images: Array<{ image: string; is_main: boolean }> | null
  } | null
}

function formatCurrency(value: number) {
  return `Bs. ${value.toFixed(2)}`
}

function normalPrice(product: EditableSessionProduct) {
  return Number(product.products?.discount_price ?? product.products?.price ?? 0)
}

function livePrice(product: EditableSessionProduct) {
  if (product.promo_price === null) return null
  const promo = Number(product.promo_price)
  const normal = normalPrice(product)
  if (!Number.isFinite(promo) || promo < 0 || promo >= normal) return null
  return promo
}

export default async function EditLiveSessionPage({
  params,
}: LiveSessionPageProps) {
  const { id } = await params
  const liveSessionId = Number(id)

  if (Number.isNaN(liveSessionId)) redirect("/admin/lives")

  const supabase = await createClient()

  const { data: session } = await (supabase as any)
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
          is_active,
          product_images(image, is_main)
        )
      )
    `)
    .eq("id", liveSessionId)
    .eq("is_global", true)
    .maybeSingle()

  if (!session) redirect("/admin/lives")

  const { data: products } = await (supabase as any)
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
    .order("name")

  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("id, name")
    .order("name")

  const hotProducts = (
    [...(session.live_products ?? [])] as EditableSessionProduct[]
  ).sort(
    (a, b) =>
      (a.order ?? 0) - (b.order ?? 0) || a.product_id - b.product_id,
  )

  const pickerProducts: LivePickerProduct[] = (
    (products ?? []) as EditableProductRow[]
  ).map((product) => {
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

  const existingProductIds = hotProducts.map((product) => product.product_id)
  const active = isHotSessionActive(session)
  const expired =
    isHotSessionExpired(session) ||
    (session.status === "ended" && session.ended_reason === "expired")
  const currentProductId =
    session.current_product_id ?? hotProducts[0]?.product_id ?? null
  const currentProduct =
    hotProducts.find((product) => product.product_id === currentProductId) ??
    null
  const livePriceCount = hotProducts.filter(
    (product) => livePrice(product) !== null,
  ).length

  const statusLabel = active
    ? "Activado"
    : expired
      ? "Finalizado por tiempo"
      : "Desactivado"

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/lives" prefetch={false}>
            <Button variant="secondary" size="sm">
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white m-0">
                Catálogo del Modo Live
              </h1>
              <LiveBadge compact variant="solid" label="MODO LIVE" />
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  active
                    ? "bg-[#27AE60]/15 text-[#27AE60]"
                    : expired
                      ? "bg-[#E74C3C]/15 text-[#E74C3C]"
                      : "bg-white/8 text-[#9CA3B8]",
                )}
              >
                {expired && <StopIcon className="h-3 w-3" />}
                {statusLabel}
              </span>
              {active && session.ends_at && (
                <span className="text-[12px] text-[#9CA3B8]">
                  Termina en{" "}
                  <HotCountdown
                    endsAt={session.ends_at}
                    className="font-semibold text-primary"
                  />
                </span>
              )}
              <span className="text-[12px] text-[#9CA3B8]">
                {hotProducts.length} producto
                {hotProducts.length === 1 ? "" : "s"} · {livePriceCount} con
                precio del Modo Live
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/lives"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white no-underline transition-colors hover:bg-white/10"
            prefetch={false}
          >
            Volver al panel
          </Link>
          <Link
            href={`/admin/lives/${liveSessionId}/studio`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white no-underline transition-colors hover:bg-primary-dark"
            prefetch={false}
          >
            <BroadcastIcon className="h-4 w-4" />
            Abrir estudio
          </Link>
        </div>
      </div>

      <LiveProductPicker
        liveSessionId={liveSessionId}
        products={pickerProducts}
        categories={(
          (categories ?? []) as Array<{ id: number; name: string }>
        ).map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        existingProductIds={existingProductIds}
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[16px] border border-white/12 bg-secondary-light p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Productos del catálogo del Modo Live
              </h2>
              <p className="mt-0.5 text-[11px] text-[#9CA3B8]">
                El orden, los precios y los estados se conservan entre
                activaciones.
              </p>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#ABB2BF]">
              {hotProducts.length}
            </span>
          </div>

          {hotProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/12 px-5 py-12 text-center">
              <BroadcastIcon className="mx-auto mb-3 h-12 w-12 text-primary/30" />
              <h3 className="text-sm font-bold text-white">
                El catálogo del Modo Live está vacío
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-[#9CA3B8]">
                Selecciona productos arriba. El Modo Live puede prepararse
                mientras está desactivado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hotProducts.map((product, index) => {
                const item = product.products
                const images = item?.product_images ?? []
                const mainImage =
                  images.find((image) => image.is_main) ?? images[0]
                const normal = normalPrice(product)
                const live = livePrice(product)
                const isCurrent = product.product_id === currentProductId
                const invalidPromo =
                  product.promo_price !== null && live === null
                const canShow =
                  !isCurrent &&
                  live !== null &&
                  (item?.stock ?? 0) > 0 &&
                  (product.status === "available" ||
                    product.status === "requested")

                return (
                  <article
                    key={product.product_id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isCurrent
                        ? "border-primary/30 bg-primary/10"
                        : "border-white/10 bg-[#2A2D35]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 w-5 shrink-0 text-center text-[11px] font-bold text-[#6B7280]">
                        {index + 1}
                      </span>
                      {mainImage ? (
                        <img
                          src={mainImage.image}
                          alt={item?.name ?? "Producto"}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] text-[#6B7280]">
                          Sin foto
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="truncate text-sm font-bold text-white">
                            {item?.name ?? "Producto"}
                          </h3>
                          {isCurrent && (
                            <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                              EN PANTALLA
                            </span>
                          )}
                          {!item?.is_active && (
                            <span className="rounded bg-[#E74C3C]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#E74C3C]">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#9CA3B8]">
                          Stock: {item?.stock ?? 0} · Orden: {index + 1}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-[13px] font-bold text-primary">
                            {live !== null
                              ? formatCurrency(live)
                              : "Sin precio del Modo Live"}
                          </span>
                          <span className="text-[11px] text-[#6B7280] line-through">
                            {formatCurrency(normal)}
                          </span>
                          {invalidPromo && (
                            <span className="text-[10px] text-[#FF8A80]">
                              El precio del Modo Live debe ser menor al normal.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                      <HotPromoForm
                        liveSessionId={liveSessionId}
                        productId={product.product_id}
                        productName={item?.name ?? "Producto"}
                        normalPrice={normal}
                        initialPromo={product.promo_price}
                      />
                      <LiveProductStatusSelect
                        sessionId={liveSessionId}
                        productId={product.product_id}
                        status={product.status}
                      />
                      {canShow && (
                        <form
                          action={setCurrentLiveProduct.bind(
                            null,
                            liveSessionId,
                            product.product_id,
                          )}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border-none bg-primary/15 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25"
                          >
                            Mostrar
                          </button>
                        </form>
                      )}
                      {isCurrent && (
                        <form
                          action={setCurrentLiveProduct.bind(
                            null,
                            liveSessionId,
                            null,
                          )}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border-none bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-[#ABB2BF] transition-colors hover:bg-white/10"
                          >
                            Quitar de pantalla
                          </button>
                        </form>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <form
                          action={moveLiveProduct.bind(
                            null,
                            liveSessionId,
                            product.product_id,
                            "up" as const,
                          )}
                        >
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label="Subir producto"
                            className="rounded-lg border-none bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-[#ABB2BF] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↑
                          </button>
                        </form>
                        <form
                          action={moveLiveProduct.bind(
                            null,
                            liveSessionId,
                            product.product_id,
                            "down" as const,
                          )}
                        >
                          <button
                            type="submit"
                            disabled={index === hotProducts.length - 1}
                            aria-label="Bajar producto"
                            className="rounded-lg border-none bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-[#ABB2BF] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </form>
                        <form
                          action={removeProductFromLiveSession.bind(
                            null,
                            liveSessionId,
                            product.product_id,
                          )}
                        >
                          <DeleteButton
                            label="Quitar"
                            confirmMessage="¿Quitar este producto del catálogo del Modo Live?"
                          />
                        </form>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <form action={updateLiveModeTitle.bind(null, liveSessionId)}>
            <div className="rounded-[16px] border border-white/12 bg-secondary-light p-5">
              <h2 className="text-base font-bold text-white">Título visible</h2>
              <p className="mt-0.5 text-[11px] text-[#9CA3B8]">
                Se muestra en la tienda cuando el Modo Live está activo.
              </p>
              <input
                type="text"
                name="title"
                required
                defaultValue={session.title}
                className="mt-3 w-full rounded-xl border border-white/12 bg-[#2A2D35] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" variant="primary" size="sm" className="mt-3">
                Guardar título
              </Button>
            </div>
          </form>

          <div className="rounded-[16px] border border-white/12 bg-secondary-light p-5">
            <h2 className="text-base font-bold text-white">Resumen</h2>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#9CA3B8]">Estado</span>
                <span className="font-semibold text-white">{statusLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#9CA3B8]">Productos</span>
                <span className="font-semibold text-white">
                  {hotProducts.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#9CA3B8]">Con precio del Modo Live</span>
                <span className="font-semibold text-white">
                  {livePriceCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#9CA3B8]">En pantalla</span>
                <span className="max-w-[160px] truncate font-semibold text-white">
                  {currentProduct?.products?.name ?? "Sin producto"}
                </span>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-white/8 bg-black/10 px-3 py-2 text-[11px] text-[#9CA3B8]">
              El catálogo y los precios no se borran al finalizar. Puedes
              preparar todo mientras el Modo Live está desactivado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
