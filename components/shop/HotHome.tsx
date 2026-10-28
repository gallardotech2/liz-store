import Image from "next/image"
import Link from "next/link"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { LiveProductCard } from "@/components/shop/LiveProductCard"
import { ScrollNudge } from "@/components/shop/ScrollNudge"
import { WhatsAppOrderButton } from "@/components/shop/WhatsAppOrderButton"
import { LiveBadge } from "@/components/ui/LiveBadge"
import { getPublicLiveTitle, isDefaultLiveTitle } from "@/lib/live-copy"
import { formatCurrency } from "@/lib/utils"
import type { HotCampaign, HotProduct } from "@/lib/hot"

interface HotHomeProps {
  campaign: HotCampaign
}

type LiveCategoryGroup = {
  key: string
  name: string
  products: HotProduct[]
}

export function HotHome({ campaign }: HotHomeProps) {
  const { session, current, products, catalog: allCatalog } = campaign
  const catalog = current
    ? allCatalog.filter((product) => product.productId !== current.productId)
    : allCatalog
  const totalProducts = catalog.length + (current ? 1 : 0)
  const groups = new Map<string, LiveCategoryGroup>()
  for (const product of catalog) {
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

  return (
    <>
      <section className="border-b border-[rgba(255,142,159,0.18)] bg-gradient-to-r from-[#FFF7F8] via-white to-[#FFF7F8] dark:from-surface dark:via-surface-elevated dark:to-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-base text-[#2D2D2D] dark:text-ink-strong sm:text-xl">
              {isDefaultLiveTitle(session.title)
                ? "Producto destacado"
                : getPublicLiveTitle(session.title)}
            </h1>
            <p className="mt-0.5 text-[11px] text-[#6B6B6B] dark:text-ink-soft">
              {totalProducts} producto{totalProducts === 1 ? "" : "s"}{" "}
              disponibles · Pide directo por WhatsApp
            </p>
          </div>
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
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        {current ? (
          <div className="overflow-hidden rounded-2xl border border-[rgba(255,142,159,0.22)] bg-white shadow-[0_10px_35px_rgba(255,142,159,0.10)] dark:border-white/10 dark:bg-surface-raised">
            <div className="grid md:grid-cols-[0.92fr_1.08fr]">
              <div className="relative aspect-[4/3] bg-[#FFFBF9] dark:bg-surface sm:aspect-[4/5] md:aspect-auto md:min-h-[420px]">
                {current.image ? (
                  <Image
                    src={current.image}
                    alt={current.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 46vw"
                    className="object-cover object-center"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FB8496] to-[#FDF8F6] text-[#B76E79] dark:to-surface">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E74C3C] px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    En pantalla
                  </span>
                  {current.discountPercent > 0 && (
                    <span className="rounded-full bg-[#C9A96E] px-2.5 py-1 text-[10px] font-bold text-white">
                      -{current.discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col p-5 sm:p-7">
                <div className="flex items-center gap-2 flex-wrap">
                  <LiveBadge compact variant="soft" label="Precio exclusivo" />
                  {current.category.name && (
                    <span className="text-[10px] font-semibold uppercase tracking-[1px] text-primary-dark dark:text-primary">
                      {current.category.name}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-serif text-2xl leading-tight text-[#2D2D2D] dark:text-ink-strong sm:text-3xl">
                  {current.name}
                </h2>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-3xl font-bold text-[#E74C3C]">
                    {formatCurrency(current.promoPrice)}
                  </span>
                  <span className="text-base text-[#9CA3B8] line-through">
                    {formatCurrency(current.normalPrice)}
                  </span>
                  {current.discountPercent > 0 && (
                    <span className="rounded bg-[#E74C3C] px-2 py-0.5 text-[10px] font-bold text-white">
                      -{current.discountPercent}%
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[rgba(255,142,159,0.18)] bg-[#FFF7F8] px-3 py-2.5 dark:border-white/10 dark:bg-surface">
                    <p className="text-[9px] uppercase tracking-[0.8px] text-[#9CA3B8]">
                      Disponibles
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#2D2D2D] dark:text-ink-strong">
                      {current.stock}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,142,159,0.18)] bg-[#FFF7F8] px-3 py-2.5 dark:border-white/10 dark:bg-surface">
                    <p className="text-[9px] uppercase tracking-[0.8px] text-[#9CA3B8]">
                      Ahorras
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#B76E79] dark:text-primary">
                      {formatCurrency(savings)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[12px] leading-[1.6] text-[#6B6B6B] dark:text-ink-soft">
                  Pide por WhatsApp y el equipo de Liz Store confirma
                  disponibilidad y entrega.
                </p>

                <div className="mt-auto space-y-2 pt-5">
                  {current.stock > 0 ? (
                    <WhatsAppOrderButton
                      productId={current.productId}
                      productName={current.name}
                      productImage={current.image ?? ""}
                      productPrice={current.promoPrice}
                      label="Pedir por WhatsApp"
                    />
                  ) : (
                    <span className="block rounded-full bg-[#F3F4F6] py-2.5 text-center text-[12px] font-semibold text-[#9CA3B8]">
                      Producto agotado por el momento
                    </span>
                  )}
                  <Link
                    href={`/productos/${current.slug}`}
                    className="block text-center text-[11px] font-semibold text-primary-dark no-underline transition-colors hover:text-primary dark:text-primary"
                    prefetch={false}
                  >
                    Ver detalle del producto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgba(255,142,159,0.22)] bg-white px-5 py-8 text-center dark:border-white/10 dark:bg-surface-raised">
            <h2 className="font-serif text-xl text-[#2D2D2D] dark:text-ink-strong">
              Catálogo disponible
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#6B6B6B] dark:text-ink-soft">
              Explora los productos del catálogo y pide por WhatsApp.
            </p>
            <Link
              href="/productos"
              className="mt-4 inline-flex rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 py-2.5 text-xs font-semibold text-white no-underline"
              prefetch={false}
            >
              Ver catálogo
            </Link>
          </div>
        )}
      </section>

      {catalog.length > 0 && (
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
              {current
                ? `${catalog.length} más`
                : `${catalog.length} producto${catalog.length === 1 ? "" : "s"}`}
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

      {catalog.length === 0 && products.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8">
          <p className="rounded-xl border border-dashed border-[rgba(255,142,159,0.35)] bg-[#FFF7F8] px-4 py-3 text-center text-[12px] text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
            Todavía no hay productos disponibles. Vuelve pronto o revisa el
            catálogo completo.
          </p>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <p className="rounded-xl border border-[rgba(255,142,159,0.18)] bg-white px-4 py-3 text-center text-[12px] text-[#6B6B6B] dark:border-white/10 dark:bg-surface-raised dark:text-ink-soft">
          Estos precios son válidos solo mientras dure la promoción.
          Para comprar, solicita el producto por WhatsApp y el equipo de Liz
          Store te confirmará la disponibilidad.
        </p>
      </section>
    </>
  )
}
