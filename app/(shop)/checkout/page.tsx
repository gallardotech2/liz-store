import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"
import { CheckoutForm } from "./CheckoutForm"
import { OrderSummary } from "./OrderSummary"

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
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { nombre: string; phone: string } | null = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nombre, phone")
      .eq("id", user.id)
      .single()
    profile = data as unknown as { nombre: string; phone: string } | null
  }

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

  const { data: storeProfile } = await (supabase as any)
    .from("store_profiles")
    .select("*")
    .single()

  const { data: paymentMethods } = await (supabase as any)
    .from("payment_methods")
    .select("id, name, code, description, icon, config")
    .eq("is_active", true)
    .order("order", { ascending: true })

  const { data: qrPayments } = await (supabase as any)
    .from("qr_payments")
    .select("id, payment_method_id, qr_type, qr_image, qr_code, account_name, account_number, bank_name, is_active")
    .eq("is_active", true)

  const { data: pickupPoints } = await (supabase as any)
    .from("pickup_points")
    .select("*")
    .eq("is_active", true)
    .order("order", { ascending: true })

  return (
    <section className="py-15">
      <div className="max-w-7xl mx-auto px-4">
        <div className="breadcrumbs py-5 text-[14px] text-[#6B6B6B]">
          <Link href="/" className="text-primary no-underline hover:underline">Inicio</Link>
          {" / "}
          <Link href="/carrito" className="text-primary no-underline hover:underline">Carrito</Link>
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
            storeProfile={storeProfile || null}
            user={user ? { id: user.id, email: user.email ?? "" } : null}
            profile={profile}
            paymentMethods={(paymentMethods ?? []) as any[]}
            qrPayments={(qrPayments ?? []) as any[]}
            pickupPoints={(pickupPoints ?? []) as any[]}
          />
          <OrderSummary items={mergedItems} />
        </div>
      </div>
    </section>
  )
}
