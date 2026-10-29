import Image from "next/image"
import Link from "next/link"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { LiveProductCard } from "@/components/shop/LiveProductCard"
import { ScrollNudge } from "@/components/shop/ScrollNudge"
import { WhatsAppOrderButton } from "@/components/shop/WhatsAppOrderButton"
import { getPublicLiveTitle, isDefaultLiveTitle } from "@/lib/live-copy"
import {
  getLivePlatformLabel,
  getSafeLiveUrl,
  getTikTokHandle,
} from "@/lib/live-url"
import { cn, formatCurrency } from "@/lib/utils"
import type { HotCampaign, HotProduct } from "@/lib/hot"

interface HotHomeProps {
  campaign: HotCampaign
  whatsappNumber: string
  storeName: string
}

type LiveCategoryGroup = {
  key: string
  name: string
  products: HotProduct[]
}

function ExternalLinkArrow({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

export function HotHome({
  campaign,
  whatsappNumber,
  storeName,
}: HotHomeProps) {
  const { session, current, products, catalog: allCatalog } = campaign
  const liveUrl = getSafeLiveUrl(session.liveUrl)
  const platformLabel = liveUrl ? getLivePlatformLabel(liveUrl) : "Live"
  const hostedLabel = liveUrl
    ? platformLabel === "Live"
      ? "Transmisión en vivo"
      : `LIVE alojado en ${platformLabel}`
    : "URL del Live no configurada"
  const tiktokHandle = getTikTokHandle(liveUrl)
  const storeLabel = storeName.trim() || "Liz Store"
  const storeInitial = storeLabel.charAt(0).toUpperCase() || "L"
  const totalProducts = allCatalog.length
  const initialSelection = products.slice(0, 4)
  const selection =
    current &&
    !initialSelection.some(
      (product) => product.productId === current.productId,
    )
      ? [current, ...initialSelection.slice(0, 3)]
      : initialSelection
  const selectedIds = new Set(
    selection.map((product) => product.productId),
  )
  const remainingCatalog = allCatalog.filter(
    (product) => !selectedIds.has(product.productId),
  )
  const groups = new Map<string, LiveCategoryGroup>()
  for (const product of remainingCatalog) {
    const key = product.category.slug || product.category.name || "otros"
    const group = groups.get(key)
    if (group) {
      group.products.push(product)
    } else {
      groups.set(key, {
        key,
        name: product.category.name || "Otros",
        products: [product],
      })
    }
  }
  const categoryGroups = [...groups.values()]
  const savings = current ? current.normalPrice - current.promoPrice : 0
  const title = isDefaultLiveTitle(session.title)
    ? "¡Hola! Descubre lo que está en LIVE"
    : getPublicLiveTitle(session.title)

  return (
    <>
      <section className="border-b border-[rgba(255,142,159,0.18)] bg-gradient-to-r from-[#FFF7F8] via-white to-[#FFF7F8] dark:from-surface dark:via-surface-elevated dark:to-surface">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-primary-dark dark:text-primary">
                Compra en vivo · Compra fácil
              </p>
              <h1 className="mt-1.5 font-serif text-2xl leading-tight text-[#2D2D2D] dark:text-ink-strong sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[#6B6B6B] dark:text-ink-soft">
                Productos reales, ofertas especiales y atención en directo.{" "}
                <span className="font-semibold text-primary-dark dark:text-primary">
                  {totalProducts} producto{totalProducts === 1 ? "" : "s"}{" "}
                  disponibles.
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {session.endsAt && (
                <div className="flex items-center gap-2 rounded-full border border-[#E74C3C]/20 bg-[#FFF5F5] px-3 py-1.5 dark:border-primary/20 dark:bg-surface-raised">
                  <span className="text-[10px] font-medium text-[#6B6B6B] dark:text-ink-soft">
                    Termina en
                  </span>
                  <HotCountdown
                    endsAt={session.endsAt}
                    className="text-[12px] font-bold text-[#E74C3C]"
                  />
                </div>
              )}
              <Link
                href="/productos"
                className="rounded-full border border-primary/30 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-primary-dark no-underline transition-colors hover:bg-primary hover:text-white dark:bg-surface-raised dark:text-primary"
                prefetch={false}
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] lg:items-start">
          <section className="min-w-0">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-serif text-lg text-[#2D2D2D] dark:text-ink-strong sm:text-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E74C3C] opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E74C3C]" />
                </span>
                Ahora en vivo
              </h2>
              <a
                href="#live"
                className="text-[11px] font-bold uppercase tracking-[0.5px] text-primary-dark no-underline transition-colors hover:text-primary dark:text-primary"
              >
                Ver Live
              </a>
            </div>

            <article className="overflow-hidden rounded-[22px] border border-[rgba(255,142,159,0.22)] bg-white shadow-[0_12px_32px_rgba(255,142,159,0.12)] dark:border-white/10 dark:bg-surface-raised">
              <div
                id="live"
                className="relative aspect-[4/5] overflow-hidden bg-[#2D2D2D] sm:aspect-[16/10] lg:aspect-[4/5]"
              >
                {current?.image ? (
                  <>
                    <Image
                      src={current.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 440px"
                      className="scale-110 object-cover object-center opacity-35 blur-2xl"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-[#2D2D2D]/25 via-primary-dark/20 to-[#2D2D2D]/90"
                      aria-hidden="true"
                    />
                    <Image
                      src={current.image}
                      alt={current.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 440px"
                      className="object-contain object-center p-5 sm:p-8"
                      priority
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-secondary-light via-primary-dark/70 to-secondary px-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/50"
                      aria-hidden="true"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <p className="text-sm font-semibold text-white/80">
                      Producto en pantalla no disponible
                    </p>
                  </div>
                )}

                <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E74C3C] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.5px] text-white shadow-[0_3px_14px_rgba(231,76,60,0.35)]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </span>
                  <span className="rounded-md border border-white/20 bg-black/35 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {liveUrl ? platformLabel : "En vivo"}
                  </span>
                </div>

                <div className="absolute left-3 top-14 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-primary bg-gradient-to-br from-[#FB8496] to-[#D4A5A5] text-sm font-extrabold text-[#2D2D2D]">
                    {storeInitial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                      {tiktokHandle ?? storeLabel}
                    </p>
                    <p className="truncate text-[10px] text-white/75 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                      {tiktokHandle
                        ? `${storeLabel} · Tienda en directo`
                        : "Tienda en directo"}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-x-3 bottom-20 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/20 bg-black/45 px-3 py-2 backdrop-blur-md">
                  <span className="text-[10px] leading-tight text-white/85">
                    {hostedLabel}
                  </span>
                  {liveUrl ? (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-dark px-3 py-2 text-[11px] font-bold text-white no-underline shadow-[0_4px_14px_rgba(255,142,159,0.3)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                      aria-label={`Abrir Live de ${storeLabel} en ${
                        platformLabel === "Live"
                          ? "la plataforma"
                          : platformLabel
                      }`}
                    >
                      Abrir Live
                      <ExternalLinkArrow />
                    </a>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold text-white/45"
                    >
                      Abrir Live
                    </span>
                  )}
                </div>

                <div className="absolute inset-x-3 bottom-3 z-10 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
                  <p className="line-clamp-2 text-[17px] font-extrabold leading-tight">
                    {current?.name ?? "Catálogo disponible"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70">
                    {current
                      ? `En vivo · ${formatCurrency(current.promoPrice)}`
                      : "Mira los productos disponibles"}
                  </p>
                </div>
              </div>

              {current ? (
                <div className="grid grid-cols-[62px_minmax(0,1fr)_92px] items-center gap-3 p-3.5 max-[359px]:grid-cols-[56px_minmax(0,1fr)] max-[359px]:gap-2">
                  <Link
                    href={`/productos/${current.slug}`}
                    className="relative h-[68px] w-[62px] overflow-hidden rounded-xl bg-[#FFF7F8] dark:bg-surface max-[359px]:h-[61px] max-[359px]:w-[56px]"
                    prefetch={false}
                  >
                    {current.image ? (
                      <Image
                        src={current.image}
                        alt={current.name}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[9px] text-[#9CA3B8]">
                        Sin foto
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[1px] text-[#C9A96E]">
                      <span className="h-1 w-1 rounded-full bg-[#C9A96E]" />
                      Producto destacado
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[#2D2D2D] dark:text-ink-strong">
                      {current.name}
                    </h2>
                    {current.shortDescription && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-[1.35] text-[#6B6B6B] dark:text-ink-soft">
                        {current.shortDescription}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[17px] font-extrabold text-[#E74C3C]">
                        {formatCurrency(current.promoPrice)}
                      </span>
                      {current.normalPrice > current.promoPrice && (
                        <span className="text-[10px] text-[#9CA3B8] line-through">
                          {formatCurrency(current.normalPrice)}
                        </span>
                      )}
                      {current.discountPercent > 0 && (
                        <span className="rounded bg-[#E74C3C] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          -{current.discountPercent}%
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <p className="mt-1 text-[9px] font-semibold text-primary-dark dark:text-primary">
                        Ahorras {formatCurrency(savings)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-stretch gap-1 max-[359px]:col-span-2 max-[359px]:flex-row">
                    {current.stock > 0 ? (
                      <WhatsAppOrderButton
                        productId={current.productId}
                        productName={current.name}
                        productImage={current.image ?? ""}
                        productPrice={current.promoPrice}
                        whatsappNumber={whatsappNumber}
                        compact
                        label="Pedir"
                        className="h-10 px-2 text-[11px] max-[359px]:flex-1"
                      />
                    ) : (
                      <span className="flex h-10 items-center justify-center rounded-full bg-[#F3F4F6] px-2 text-center text-[10px] font-semibold text-[#9CA3B8] dark:bg-surface dark:text-ink-soft">
                        Agotado
                      </span>
                    )}
                    <Link
                      href={`/productos/${current.slug}`}
                      className="text-center text-[10px] font-semibold text-primary-dark no-underline transition-colors hover:text-primary dark:text-primary"
                      prefetch={false}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-[#6B6B6B] dark:text-ink-soft">
                    Explora los productos disponibles y pide por WhatsApp.
                  </p>
                  <Link
                    href="/productos"
                    className="mt-3 inline-flex rounded-full bg-gradient-to-br from-primary to-primary-dark px-4 py-2 text-[11px] font-semibold text-white no-underline"
                    prefetch={false}
                  >
                    Ver catálogo
                  </Link>
                </div>
              )}
            </article>
          </section>

          <aside className="min-w-0" aria-label="Productos del LIVE">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg text-[#2D2D2D] dark:text-ink-strong sm:text-xl">
                Productos en este LIVE
              </h2>
              <Link
                href="/productos"
                className="text-[11px] font-bold uppercase tracking-[0.5px] text-primary-dark no-underline transition-colors hover:text-primary dark:text-primary"
                prefetch={false}
              >
                Ver todos
              </Link>
            </div>

            {selection.length > 0 ? (
              <>
                <div
                  className="overflow-x-auto overscroll-x-contain pb-2 -mx-4 px-4 lg:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <ScrollNudge>
                    {selection.map((product, index) => (
                      <LiveProductCard
                        key={product.productId}
                        product={product}
                        whatsappNumber={whatsappNumber}
                        variant="mini"
                        priority={index === 0}
                        className="w-[112px] flex-shrink-0"
                      />
                    ))}
                  </ScrollNudge>
                </div>
                <div className="hidden gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-4">
                  {selection.map((product, index) => (
                    <LiveProductCard
                      key={product.productId}
                      product={product}
                      whatsappNumber={whatsappNumber}
                      variant="mini"
                      priority={index === 0}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-[rgba(255,142,159,0.35)] bg-[#FFF7F8] px-4 py-3 text-[12px] text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
                Todavía no hay productos disponibles en este LIVE.
              </p>
            )}
          </aside>
        </div>
      </div>

      {categoryGroups.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-[#2D2D2D] dark:text-ink-strong sm:text-3xl">
                Catálogo activo
              </h2>
              <p className="mt-1 text-[12px] text-[#6B6B6B] dark:text-ink-soft">
                Desliza por categoría y pide por WhatsApp.
              </p>
            </div>
            <span className="rounded-full border border-[rgba(255,142,159,0.25)] bg-white px-3 py-1 text-[10px] font-semibold text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
              {remainingCatalog.length} producto
              {remainingCatalog.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-6">
            {categoryGroups.map((group) => (
              <div key={group.key}>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h3 className="font-serif text-lg text-[#2D2D2D] dark:text-ink-strong">
                    {group.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-[#9CA3B8]">
                    {group.products.length}
                  </span>
                </div>
                <div
                  className="overflow-x-auto overscroll-x-contain pb-2 -mx-4 px-4"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  aria-label={`Productos de ${group.name}`}
                >
                  <ScrollNudge>
                    {group.products.map((product) => (
                      <LiveProductCard
                        key={product.productId}
                        product={product}
                        whatsappNumber={whatsappNumber}
                        className="w-[160px] flex-shrink-0 sm:w-[190px] lg:w-[210px]"
                      />
                    ))}
                  </ScrollNudge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {allCatalog.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8">
          <p className="rounded-xl border border-dashed border-[rgba(255,142,159,0.35)] bg-[#FFF7F8] px-4 py-3 text-center text-[12px] text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
            Todavía no hay productos disponibles. Vuelve pronto o revisa el
            catálogo completo.
          </p>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <p className="rounded-xl border border-[rgba(255,142,159,0.18)] bg-white px-4 py-3 text-center text-[12px] text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
          Estos precios son válidos solo mientras dure la promoción. Para
          comprar, solicita el producto por WhatsApp y el equipo de{" "}
          {storeLabel} te confirmará la disponibilidad.
        </p>
      </section>
    </>
  )
}
