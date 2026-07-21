"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  stock: number
}

interface CheckoutTotals {
  subtotal: number
  shipping: number
  total: number
  freeShippingRemaining: number
}

interface StoreProfile {
  account_name?: string
  bank_name?: string
  account_number?: string
  qr_code?: string
}

interface CheckoutFormProps {
  items: CartItem[]
  totals: CheckoutTotals
  storeProfile: StoreProfile | null
}

export function CheckoutForm({ items, totals, storeProfile }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "home">("pickup")
  const [pickupLocation, setPickupLocation] = useState("Calle de la Paz #124, Livia")
  const [paymentMethod, setPaymentMethod] = useState<"escudo" | "direct">("direct")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [addressText, setAddressText] = useState("")
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"form" | "confirm">(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("liz_whatsapp_sent") === "1") {
      sessionStorage.removeItem("liz_whatsapp_sent")
      return "confirm"
    }
    return "form"
  })
  const shipping = deliveryMethod === "pickup" ? 0 : totals.shipping
  const finalTotal = totals.subtotal + shipping

  function buildWhatsAppMessage(): string {
    const deliveryInfo = deliveryMethod === "pickup"
      ? `📍 Recoger en: ${pickupLocation}`
      : `🚚 Envío a domicilio: ${addressText}${reference ? `\n📝 Ref: ${reference}` : ""}`

    const itemsText = items
      .map((i) => `• ${i.name} x${i.quantity} - Bs. ${(i.price * i.quantity).toFixed(2)}`)
      .join("\n")

    let msg = "━━━━━━━━━━━━━━━━\n"
      + "🛍️ *Mi Pedido*\n"
      + "━━━━━━━━━━━━━━━━\n"
      + `👤 *Nombre:* ${name}\n`
    if (phone) msg += `📞 *Teléfono:* ${phone}\n`
    msg += `\n*Productos:*\n${itemsText}\n\n`
    msg += `${deliveryInfo}\n`
    msg += `\n💰 *Total: Bs. ${finalTotal.toFixed(2)}*\n`
    if (notes) msg += `\n📝 *Notas:* ${notes}\n`
    msg += "\n━━━━━━━━━━━━━━━━\n"
      + "✅ *Solicitud enviada desde Liz Store*"
    return msg
  }

  function handleSendWhatsApp() {
    if (!name.trim()) {
      setError("Ingresa tu nombre")
      return
    }
    if (deliveryMethod === "home" && !locationConfirmed) {
      setError("Selecciona tu ubicación en el mapa")
      return
    }
    setError("")
    const msg = buildWhatsAppMessage()
    const whatsappUrl = `https://wa.me/59176426643?text=${encodeURIComponent(msg)}`
    sessionStorage.setItem("liz_whatsapp_sent", "1")
    window.open(whatsappUrl, "_blank")
    setStatus("confirm")
  }

  function sendWhatsAppMsg() {
    const msg = buildWhatsAppMessage()
    const whatsappUrl = `https://wa.me/59176426643?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, "_blank")
  }

  async function handleCheckout() {
    if (!name.trim()) {
      setError("Ingresa tu nombre")
      return
    }
    if (deliveryMethod === "home" && !locationConfirmed) {
      setError("Selecciona tu ubicación en el mapa")
      return
    }
    setError("")
    setLoading(true)

    const formData = new FormData()
    formData.set("name", name.trim())
    formData.set("phone", phone)
    formData.set("deliveryMethod", deliveryMethod)
    formData.set("deliveryLatitude", lat)
    formData.set("deliveryLongitude", lng)
    formData.set("deliveryAddressText", deliveryMethod === "home" ? addressText : pickupLocation)
    formData.set("deliveryReference", reference)
    formData.set("pickupLocation", pickupLocation)
    formData.set("paymentMethod", paymentMethod)
    formData.set("notes", notes)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Error al procesar el pedido")
      }
      const { url } = await res.json()
      router.push(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el pedido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {status === "confirm" && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setStatus("form")}>
          <div
            className="bg-white rounded-[20px] p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#27AE60] text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-serif text-[#2D2D2D] mb-3">✅ Tu solicitud fue enviada correctamente.</h3>
            <p className="text-sm text-[#888888] mb-6 leading-[1.6]">
              Hemos preparado tu pedido en WhatsApp. Si no se abrió automáticamente,
              presiona el botón para continuar.
            </p>
            <button
              onClick={sendWhatsAppMsg}
              className="w-full py-3.5 px-6 rounded-full bg-[#25D366] text-white font-semibold text-sm border-none cursor-pointer hover:bg-[#1DA851] transition-colors mb-3 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Abrir WhatsApp
            </button>
            <button
              onClick={() => setStatus("form")}
              className="text-sm text-[#888888] bg-transparent border-none cursor-pointer hover:text-[#2D2D2D] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="checkout-form">
        <form
          action={handleCheckout}
          className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        >
          <h2 className="text-lg font-serif text-[#2D2D2D] mb-6">Datos de contacto</h2>

          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-[13px] text-[#888888] font-medium">Nombre completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
              className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-[13px] text-[#888888] font-medium">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de contacto (opcional)"
              className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full"
            />
          </div>

          <h2 className="text-lg font-serif text-[#2D2D2D] mb-6 mt-10" style={{ marginTop: 40 }}>
            🚚 Método de entrega
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            <label
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                deliveryMethod === "pickup"
                  ? "border-primary bg-[rgba(255,142,159,0.06)]"
                  : "border-[#EEE] bg-white hover:border-[#DDD]"
              }`}
              onClick={() => setDeliveryMethod("pickup")}
            >
              <input
                type="radio"
                name="delivery_method"
                value="pickup"
                checked={deliveryMethod === "pickup"}
                onChange={() => setDeliveryMethod("pickup")}
                className="mt-1 accent-primary"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#2D2D2D]">Recoger en paquetería</div>
                <div className="text-[13px] text-[#888888]">Pasas a recoger tu pedido por nuestra dirección</div>
                <span className="inline-block mt-1 text-[11px] font-bold text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-2 py-0.5 rounded">GRATIS</span>
              </div>
            </label>

            <label
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                deliveryMethod === "home"
                  ? "border-primary bg-[rgba(255,142,159,0.06)]"
                  : "border-[#EEE] bg-white hover:border-[#DDD]"
              }`}
              onClick={() => setDeliveryMethod("home")}
            >
              <input
                type="radio"
                name="delivery_method"
                value="home"
                checked={deliveryMethod === "home"}
                onChange={() => setDeliveryMethod("home")}
                className="mt-1 accent-primary"
              />
                <div className="flex-1">
                <div className="font-semibold text-sm text-[#2D2D2D]">Envío a domicilio</div>
                <div className="text-[13px] text-[#888888]">Recibe tu pedido en la puerta de tu casa</div>
                {shipping > 0 && (
                  <span className="inline-block mt-1 text-[11px] font-bold text-primary bg-[rgba(255,142,159,0.1)] px-2 py-0.5 rounded">
                    Bs. {shipping.toFixed(2)}
                  </span>
                )}
              </div>
            </label>
          </div>

          {deliveryMethod === "pickup" && (
            <div className="mb-6 p-5 rounded-xl bg-[#FDF8F6]">
              <p className="text-[14px] text-[#888888] mb-4">
                Selecciona el punto de recogida más cercano a ti. Puedes pasar por tu pedido de <strong>lunes a sábado de 10:00 AM a 8:00 PM</strong>.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "Calle de la Paz #124, Livia", label: "📍 Calle de la Paz #124, Livia", schedule: "Lun-Sáb 10:00 - 20:00" },
                  { value: "Av. Central #500, Santa Cruz", label: "📍 Av. Central #500, Santa Cruz", schedule: "Lun-Sáb 10:00 - 20:00" },
                  { value: "Calle Bolívar #300, Cochabamba", label: "📍 Calle Bolívar #300, Cochabamba", schedule: "Lun-Sáb 10:00 - 20:00" },
                ].map((loc) => (
                  <label
                    key={loc.value}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      pickupLocation === loc.value
                        ? "bg-white border border-primary"
                        : "bg-white border border-[#EEE] hover:border-[#DDD]"
                    }`}
                    onClick={() => setPickupLocation(loc.value)}
                  >
                    <input
                      type="radio"
                      name="pickup_location"
                      value={loc.value}
                      checked={pickupLocation === loc.value}
                      onChange={() => setPickupLocation(loc.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-[#2D2D2D]">{loc.label}</div>
                      <div className="text-[12px] text-[#888888]">{loc.schedule}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {deliveryMethod === "home" && (
            <div className="mb-6">
              <p className="text-[14px] text-[#888888] mb-4">
                Selecciona tu ubicación para facilitar la entrega de tu pedido.
              </p>
              <div className="rounded-xl overflow-hidden border border-[#EEE]">
                <div className="h-[300px] bg-[#FDF8F6] flex items-center justify-center text-[#888888] text-sm p-4 text-center">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p>Mapa no disponible en esta vista. Ingresa tu dirección manualmente.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                <label className="text-[13px] text-[#888888] font-medium">Dirección de entrega</label>
                <input
                  type="text"
                  value={addressText}
                  onChange={(e) => { setAddressText(e.target.value); setLocationConfirmed(!!e.target.value) }}
                  placeholder="Ej: Av. Principal #123, Santa Cruz"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                <label className="text-[13px] text-[#888888] font-medium">Referencias</label>
                <textarea
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  rows={2}
                  placeholder="Ej: Casa de rejas verdes, frente al parque, edificio azul"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full resize-y"
                />
              </div>
              <input type="hidden" name="delivery_latitude" value={lat} />
              <input type="hidden" name="delivery_longitude" value={lng} />
              <input type="hidden" name="delivery_address_text" value={addressText} />
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-[13px] text-[#888888] font-medium">Notas adicionales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Alguna nota especial para tu pedido..."
              className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full resize-y"
            />
          </div>

          <h2 className="text-lg font-serif text-[#2D2D2D] mb-6 mt-10" style={{ marginTop: 40 }}>
            Método de pago
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            {/* Escudo Pago: pendiente de activación. Reactivar con ESCUDO_PAGO_ENABLED en lib/features.ts */}
            {ESCUDO_PAGO_ENABLED && (
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "escudo"
                    ? "border-primary bg-[rgba(255,142,159,0.06)]"
                    : "border-[#EEE] bg-white hover:border-[#DDD]"
                }`}
                onClick={() => setPaymentMethod("escudo")}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="escudo"
                  checked={paymentMethod === "escudo"}
                  onChange={() => setPaymentMethod("escudo")}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#2D2D2D]">Escudo Pago</div>
                  <div className="text-[13px] text-[#888888]">Pago seguro con protección al comprador</div>
                </div>
              </label>
            )}

            <label
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                paymentMethod === "direct"
                  ? "border-primary bg-[rgba(255,142,159,0.06)]"
                  : "border-[#EEE] bg-white hover:border-[#DDD]"
              }`}
              onClick={() => setPaymentMethod("direct")}
            >
              <input
                type="radio"
                name="payment_method"
                value="direct"
                checked={paymentMethod === "direct"}
                onChange={() => setPaymentMethod("direct")}
                className="mt-1 accent-primary"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#2D2D2D]">Pago Directo</div>
                <div className="text-[13px] text-[#888888]">Paga directamente al vendedor vía QR o transferencia</div>
              </div>
            </label>
          </div>

          {/* Escudo Pago info: pendiente de activación (ESCUDO_PAGO_ENABLED) */}
          {ESCUDO_PAGO_ENABLED && paymentMethod === "escudo" && (
            <div className="mb-6 p-5 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)]">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Escudo Pago
              </h4>
              <p className="text-[13px] text-[#888888] leading-[1.6]">
                Tu dinero está protegido y solo se liberará cuando confirmes que recibiste tu pedido. <strong>No pagas hasta estar satisfecha.</strong>
              </p>
            </div>
          )}

          {paymentMethod === "direct" && (
            <div className="mb-6 p-5 rounded-xl bg-[#FDF8F6] border border-[#EEE]">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="11" x2="12" y2="11"/></svg>
                Pago Directo
              </h4>
              <p className="text-[13px] text-[#888888] leading-[1.6] mb-4">
                Transfiere el monto total directamente al vendedor.
              </p>
              {storeProfile && (
                <div className="text-[13px] text-[#2D2D2D] space-y-1.5 bg-white p-3.5 rounded-xl">
                  {storeProfile.account_name && (
                    <div className="flex justify-between"><span className="text-[#888888]">Titular:</span><strong>{storeProfile.account_name}</strong></div>
                  )}
                  {storeProfile.bank_name && (
                    <div className="flex justify-between"><span className="text-[#888888]">Banco:</span><strong>{storeProfile.bank_name}</strong></div>
                  )}
                  {storeProfile.account_number && (
                    <div className="flex justify-between"><span className="text-[#888888]">Cuenta:</span><strong>{storeProfile.account_number}</strong></div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-[#E74C3C] text-[13px] flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="whatsapp"
              disabled={loading}
              onClick={handleSendWhatsApp}
              className="w-full justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Solicitar pedido por WhatsApp — Bs. {finalTotal.toFixed(2)}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
