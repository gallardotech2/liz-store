import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { clearCartCookie } from "@/lib/cart"

export const metadata = {
  title: "Pedido Confirmado | Liz Store",
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const orderId = Number(id)

  if (isNaN(orderId)) notFound()

  const { data: order } = await (supabase as any)
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()

  if (!order) notFound()

  const { data: items } = await (supabase as any)
    .from("order_items")
    .select("id, quantity, unit_price, product:products(name, slug)")
    .eq("order_id", orderId)

  const cookieStore = await cookies()
  clearCartCookie(cookieStore)

  return (
    <section className="py-15">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-[rgba(39,174,96,0.1)] flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-[#888888] text-[15px] leading-[1.7] max-w-md mx-auto">
            Gracias por tu compra. Te hemos enviado un resumen del pedido
            para que puedas dar seguimiento.
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-left mb-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#EEE]">
            <div>
              <div className="text-[13px] text-[#888888]">Pedido</div>
              <div className="font-semibold text-[#2D2D2D]">#{order.id}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] text-[#888888]">Total</div>
              <div className="font-semibold text-primary">Bs. {Number(order.total).toFixed(2)}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[13px] text-[#888888] mb-3">Productos</div>
            <div className="space-y-3">
              {(items ?? []).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="text-sm text-[#2D2D2D]">
                    {item.product?.name ?? "Producto"} <span className="text-[#888888]">x{item.quantity}</span>
                  </div>
                  <div className="text-sm font-medium">Bs. {(item.unit_price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#EEE] pt-4 space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#888888]">Subtotal</span>
              <span>Bs. {Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#888888]">Envío</span>
              <span>{Number(order.shipping) === 0 ? <span className="text-[#27AE60] font-semibold">GRATIS</span> : `Bs. ${Number(order.shipping).toFixed(2)}`}</span>
            </div>
            {order.payment_method === "direct" && (
              <div className="mt-4 p-4 rounded-xl bg-[rgba(183,110,121,0.06)] border border-[rgba(183,110,121,0.15)]">
                <div className="text-[13px] font-semibold text-[#2D2D2D] mb-2">Pago Directo</div>
                <p className="text-[12px] text-[#888888] leading-[1.6]">
                  Una vez confirmemos tu pago, procesaremos tu pedido. Si elegiste transferencia, por favor envía el comprobante a nuestro WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white text-sm font-semibold no-underline hover:bg-primary/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Volver al inicio
          </Link>
          <a
            href="https://wa.me/59176426643"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#25D366] text-white text-sm font-semibold no-underline hover:bg-[#1DA851] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
