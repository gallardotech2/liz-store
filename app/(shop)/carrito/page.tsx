import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  parseCart,
  calculateCartTotal,
  CART_COOKIE,
} from "@/lib/cart"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"
import { removeFromCartAction, updateQuantityAction } from "./actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Carrito de Compras",
  description: "Revisa tu carrito de compras en Liz Store.",
}

export default async function CartPage() {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)
  const cartItems = Object.values(cart)

  if (cartItems.length === 0) {
    return (
      <section className="py-15">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
              Tu carrito
            </div>
            <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
              Carrito de Compras
            </h1>
          </div>
          <div className="text-center py-20">
            <div className="text-[64px] text-[rgb(251,132,150)] mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <h2 className="text-[#2D2D2D] mb-3 font-serif text-2xl">
              Tu carrito está vacío
            </h2>
            <p className="text-[#888888] mb-6">
              Explora nuestro catálogo y encuentra las piezas que más te gusten.
            </p>
            <Link href="/productos" prefetch={false}>
              <Button variant="primary">Ver catálogo</Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const productIds = cartItems.map((item) => Number(item.id))
  const supabase = await createClient()
  const { data: products } = await (supabase as any)
    .from("products")
    .select("id, price, discount_price, stock, slug, name, product_images(image, is_main)")
    .in("id", productIds)
    .eq("is_active", true)

  const productMap = new Map(
    (products ?? []).map((p: Record<string, unknown>) => [p.id, p]),
  )

  const mergedItems = cartItems.map((item) => {
    const dbProduct = productMap.get(Number(item.id)) as Record<string, unknown> | undefined
    if (dbProduct) {
      const images = dbProduct.product_images as Array<{ image: string; is_main: boolean }> | undefined
      const mainImage = images?.find((img) => img.is_main) ?? images?.[0]
      const currentPrice = (dbProduct.discount_price as number | null) ?? (dbProduct.price as number)
      return {
        ...item,
        price: currentPrice,
        image: mainImage?.image ?? item.image,
        name: (dbProduct.name as string) ?? item.name,
        slug: (dbProduct.slug as string) ?? item.slug,
        stock: (dbProduct.stock as number) ?? item.quantity,
      } as import("@/lib/cart").CartItem & { stock: number }
    }
    return { ...item, stock: item.quantity } as import("@/lib/cart").CartItem & { stock: number }
  })

  const summary = calculateCartTotal(
    Object.fromEntries(mergedItems.map((i) => [i.id, i])),
  )

  return (
    <section className="py-15">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Tu carrito
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            Carrito de Compras
          </h1>
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-10 items-start max-lg:grid-cols-1">
          <div>
            {mergedItems.map((item) => {
              const total = item.price * item.quantity
              return (
                <div
                  key={item.id}
                  className="flex gap-5 bg-white rounded-[16px] p-5 mb-3.75 shadow-[0_1px_3px_rgba(0,0,0,0.08)] items-center max-md:flex-wrap"
                >
                  <div className="w-[100px] h-[100px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#FFFBF9]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans text-base mb-1.5">
                      <Link
                        href={`/productos/${item.slug}`}
                        className="text-[#2D2D2D] no-underline hover:text-primary"
                        prefetch={false}
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <div className="text-primary font-semibold text-lg mb-3">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <form action={updateQuantityAction} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={item.id} />
                        <input
                          type="number"
                          name="quantity"
                          defaultValue={item.quantity}
                          min={0}
                          max={item.stock}
                          className="w-15 px-1.5 py-1 border border-[#ddd] rounded-[6px] text-center text-sm"
                        />
                        <button
                          type="submit"
                          className="text-xs text-primary font-semibold bg-none border-none cursor-pointer hover:underline"
                        >
                          Actualizar
                        </button>
                      </form>
                      <form action={removeFromCartAction}>
                        <input type="hidden" name="productId" value={item.id} />
                        <button
                          type="submit"
                          className="text-[#E74C3C] no-underline text-sm bg-none border-none cursor-pointer hover:opacity-70"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary font-serif min-w-[100px] text-right max-md:text-left max-md:min-w-auto">
                    {formatCurrency(total)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sticky top-[100px]">
            <h3 className="text-xl mb-6 pb-4 border-b border-[#EEE] font-serif text-[#2D2D2D]">
              Resumen del pedido
            </h3>
            <div className="flex justify-between mb-3 text-[15px]">
              <span className="text-[#888888]">Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3 text-[15px]">
              <span className="text-[#888888]">Envío</span>
              <span>
                {summary.shipping === 0 ? (
                  <span className="text-[#27AE60] font-semibold">GRATIS</span>
                ) : (
                  formatCurrency(summary.shipping)
                )}
              </span>
            </div>
            <div className="flex justify-between text-[22px] font-bold text-primary border-t border-[#EEE] pt-4 mt-4 font-serif">
              <span>Total</span>
              <span>{formatCurrency(summary.total)}</span>
            </div>
            {summary.freeShippingRemaining > 0 && (
              <div className="text-center text-[13px] text-[#27AE60] mt-3 pt-2.5 pb-2.5 px-2.5 bg-[rgba(39,174,96,0.08)] rounded-[8px]">
                ✦ Agrega {formatCurrency(summary.freeShippingRemaining)} más para
                envío gratis
              </div>
            )}
            <Link href="/checkout" prefetch={false}>
              <Button variant="primary" className="w-full justify-center mt-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Proceder al pago
              </Button>
            </Link>
            <Link
              href="/productos"
              className="block text-center mt-3 text-sm text-[#888888] no-underline hover:text-primary"
              prefetch={false}
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
