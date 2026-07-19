import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"
import { CheckoutForm } from "./CheckoutForm"

export const metadata = {
  title: "Finalizar Compra | Liz Store",
}

export default async function CheckoutPage() {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)
  const cartItems = Object.values(cart)

  if (cartItems.length === 0) {
    redirect("/carrito")
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

  const { data: profile } = await (supabase as any)
    .from("store_profiles")
    .select("*")
    .single()

  return (
    <section className="py-15">
      <div className="max-w-7xl mx-auto px-4">
        <div className="breadcrumbs py-5 text-[14px] text-[#888888]">
          <a href="/" className="text-primary no-underline hover:underline">Inicio</a>
          {" / "}
          <a href="/carrito" className="text-primary no-underline hover:underline">Carrito</a>
          {" / "}
          <span>Pagar</span>
        </div>

        <div className="text-center mb-12">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Finalizar compra
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            Finalizar compra
          </h1>
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-10 items-start max-lg:grid-cols-1">
          <CheckoutForm
            items={mergedItems}
            totals={{
              subtotal: summary.subtotal,
              shipping: summary.shipping,
              total: summary.total,
              freeShippingRemaining: summary.freeShippingRemaining,
            }}
            storeProfile={profile || null}
          />
          <div className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sticky top-[100px]">
            <h3 className="text-xl mb-6 pb-4 border-b border-[#EEE] font-serif text-[#2D2D2D]">
              Resumen del pedido
            </h3>
            {mergedItems.map((item) => {
              const total = item.price * item.quantity
              return (
                <div
                  key={item.id}
                  className="flex gap-3 mb-4 pb-4 border-b border-[#F5F5F5]"
                >
                  <div className="w-[60px] h-[60px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#FFFBF9]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)] text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#2D2D2D] truncate">{item.name}</div>
                    <div className="text-[12px] text-[#888888]">x{item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary shrink-0">
                    Bs. {total.toFixed(2)}
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between mb-2 text-[14px]">
              <span className="text-[#888888]">Subtotal</span>
              <span>Bs. {summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-[14px]">
              <span className="text-[#888888]">Envío</span>
              <span id="sidebarShipping">
                {summary.shipping === 0 ? (
                  <span className="text-[#27AE60] font-semibold">GRATIS</span>
                ) : (
                  `Bs. ${summary.shipping.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-[20px] font-bold text-primary border-t border-[#EEE] pt-4 mt-4 font-serif">
              <span>Total</span>
              <span id="sidebarTotal">Bs. {summary.total.toFixed(2)}</span>
            </div>
            {summary.freeShippingRemaining > 0 && (
              <div className="text-center text-[13px] text-[#27AE60] mt-3 pt-2.5 pb-2.5 px-2.5 bg-[rgba(39,174,96,0.08)] rounded-[8px]">
                ✦ Agrega Bs. {summary.freeShippingRemaining.toFixed(2)} más para envío gratis
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
