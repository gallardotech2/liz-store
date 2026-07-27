"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

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

interface QrPaymentInfo {
  id: number
  payment_method_id: number
  qr_type: string
  qr_image: string | null
  qr_code: string
  account_name: string
  account_number: string
  bank_name: string
  is_active: boolean
}

interface PaymentMethodInfo {
  id: number
  name: string
  code: string
  description: string
  icon: string
  config: Record<string, unknown>
}

interface PickupPoint {
  id: number
  name: string
  address: string
  schedule: string
  google_maps_url: string
}

interface CheckoutFormProps {
  items: CartItem[]
  totals: CheckoutTotals
  storeProfile: StoreProfile | null
  user: { id: string; email: string } | null
  profile: { nombre: string; phone: string } | null
  paymentMethods: PaymentMethodInfo[]
  qrPayments: QrPaymentInfo[]
  pickupPoints: PickupPoint[]
}

export function CheckoutForm({ items, totals, storeProfile, user, profile, paymentMethods, qrPayments, pickupPoints }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "home">("pickup")
  const defaultPickup = pickupPoints.length > 0 ? pickupPoints[0].name : ""
  const [pickupLocation, setPickupLocation] = useState(defaultPickup)
  const defaultMethod = paymentMethods.length > 0 ? paymentMethods[0].code : "pago_directo"
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [referenceCode, setReferenceCode] = useState("")
  const [status, setStatus] = useState<"form" | "confirm" | "success">("form")
  const finalTotal = totals.subtotal

  useEffect(() => {
    if (user && profile) {
      setName(profile.nombre || "")
      setPhone(profile.phone || "")
    }
  }, [user, profile])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sent = sessionStorage.getItem("liz_whatsapp_sent")
      if (sent === "1") {
        sessionStorage.removeItem("liz_whatsapp_sent")
        setStatus("confirm")
      }
    }
  }, [])

  function buildWhatsAppMessage(): string {
    const deliveryInfo = deliveryMethod === "pickup"
      ? `📍 Recoger en: ${pickupLocation}`
      : `🚚 Envío a domicilio - Pendiente de coordinar por WhatsApp`

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
    const pmName = paymentMethods.find((p) => p.code === paymentMethod)?.name || paymentMethod
    msg += `💳 *Pago:* ${pmName}\n`
    if (notes) msg += `\n📝 *Notas:* ${notes}\n`
    if (referenceCode) msg += `\n🔖 *Código:* ${referenceCode}\n`
    msg += "\n━━━━━━━━━━━━━━━━\n"
      + "✅ *Solicitud enviada desde Liz Store*"
    return msg
  }

  function validate(): boolean {
    if (!name.trim()) {
      setError("Ingresa tu nombre")
      return false
    }
    return true
  }

  function sendWhatsAppMsg() {
    const msg = buildWhatsAppMessage()
    const whatsappUrl = `https://wa.me/59176426643?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, "_blank")
  }

  async function handleSendWhatsApp() {
    setError("")
    if (!validate()) return

    setLoading(true)

    try {
      if (user) {
        const res = await fetch("/api/whatsapp-request/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              image: i.image,
            })),
            name: name.trim(),
            phone,
            deliveryMethod,
            addressText: deliveryMethod === "home" ? "Pendiente de coordinar" : (() => { const p = pickupPoints.find(p => p.name === pickupLocation); return p ? `${p.name} - ${p.address}` : pickupLocation })(),
            reference: "",
            notes,
            paymentMethod,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Error al crear la solicitud")
          setLoading(false)
          return
        }

        setReferenceCode(data.referenceCode)
      }

      const msg = buildWhatsAppMessage()
      const whatsappUrl = `https://wa.me/59176426643?text=${encodeURIComponent(msg)}`
      sessionStorage.setItem("liz_whatsapp_sent", "1")
      window.open(whatsappUrl, "_blank")

      setStatus(user ? "success" : "confirm")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {status === "success" && user && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[20px] p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#27AE60] text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-serif text-[#2D2D2D] mb-3">Pedido solicitado correctamente</h3>
            {referenceCode && (
              <div className="mb-4 p-3 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)]">
                <p className="text-[12px] text-[#888888] mb-1">Código de referencia</p>
                <p className="text-lg font-bold text-[#2D2D2D] tracking-wider">{referenceCode}</p>
              </div>
            )}
            <div className="text-left mb-6 p-4 rounded-xl bg-[#FDF8F6]">
              <p className="text-[14px] font-semibold text-[#2D2D2D] mb-2">Resumen del pedido</p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5 text-[13px] text-[#888888]">
                  <span className="text-[#2D2D2D] font-medium">{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/perfil/historial")}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white font-semibold text-sm border-none cursor-pointer hover:-translate-y-0.5 transition-all mb-3 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Ver pedido
            </button>
            <button
              onClick={() => {
                sendWhatsAppMsg()
                setStatus("form")
              }}
              className="w-full py-3.5 px-6 rounded-full bg-[#25D366] text-white font-semibold text-sm border-none cursor-pointer hover:bg-[#1DA851] transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Abrir WhatsApp
            </button>
          </div>
        </div>
      )}

      {status === "confirm" && !user && (
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

      <div className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-serif text-[#2D2D2D] mb-6">Datos de contacto</h2>

        {user && profile && (
          <div className="mb-5 p-3.5 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)] text-[13px] text-[#888888]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 -mt-0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Tus datos se cargaron automáticamente desde tu perfil.
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[13px] text-[#888888] font-medium">Nombre completo *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={user ? "Cargando..." : "Tu nombre"}
            className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] border border-[#EEE] text-[#2D2D2D] text-sm outline-none focus:border-primary transition-colors w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[13px] text-[#888888] font-medium">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={user ? "Cargando..." : "Número de contacto (opcional)"}
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
              <div className="text-[13px] text-[#888888]">Cotiza tu envío por WhatsApp</div>
            </div>
          </label>
        </div>

        {deliveryMethod === "pickup" && (
          <div className="mb-6 p-5 rounded-xl bg-[#FDF8F6]">
            <p className="text-[14px] text-[#888888] mb-4">
              Selecciona el punto de recogida más cercano a ti.
            </p>
            <div className="flex flex-col gap-2">
              {pickupPoints.length === 0 && (
                <p className="text-[13px] text-[#888888]">No hay puntos de recogida disponibles.</p>
              )}
              {pickupPoints.map((point) => (
                <div key={point.id}>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      pickupLocation === point.name
                        ? "bg-white border border-primary"
                        : "bg-white border border-[#EEE] hover:border-[#DDD]"
                    }`}
                    onClick={() => setPickupLocation(point.name)}
                  >
                    <input
                      type="radio"
                      name="pickup_location"
                      value={point.name}
                      checked={pickupLocation === point.name}
                      onChange={() => setPickupLocation(point.name)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#2D2D2D]">{point.name}</div>
                      <div className="text-[12px] text-[#888888]">{point.address}</div>
                      <div className="text-[12px] text-[#888888] mt-0.5">{point.schedule}</div>
                      {point.google_maps_url && (
                        <a
                          href={point.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold no-underline hover:bg-primary/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Ver ubicación
                        </a>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {deliveryMethod === "home" && (
          <div className="mb-6 p-5 rounded-xl bg-[#FDF8F6]">
            <p className="text-[14px] text-[#888888]">
              El costo y la disponibilidad del envío se coordinarán directamente por WhatsApp.
            </p>
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
          {paymentMethods.map((pm) => {
            const qrConfig = qrPayments.find((q) => q.payment_method_id === pm.id)
            return (
              <div key={pm.id}>
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    paymentMethod === pm.code
                      ? "border-primary bg-[rgba(255,142,159,0.06)]"
                      : "border-[#EEE] bg-white hover:border-[#DDD]"
                  }`}
                  onClick={() => setPaymentMethod(pm.code)}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={pm.code}
                    checked={paymentMethod === pm.code}
                    onChange={() => setPaymentMethod(pm.code)}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#2D2D2D]">{pm.icon} {pm.name}</div>
                    {pm.description && (
                      <div className="text-[13px] text-[#888888]">{pm.description}</div>
                    )}
                  </div>
                </label>
                {paymentMethod === pm.code && qrConfig && (
                  <div className="mt-3 p-5 rounded-xl bg-[#FDF8F6] border border-[#EEE]">
                    <div className="space-y-1.5 text-[13px] text-[#2D2D2D]">
                      {qrConfig.account_name && (
                        <div className="flex justify-between"><span className="text-[#888888]">Titular:</span><strong>{qrConfig.account_name}</strong></div>
                      )}
                      {qrConfig.bank_name && (
                        <div className="flex justify-between"><span className="text-[#888888]">Banco:</span><strong>{qrConfig.bank_name}</strong></div>
                      )}
                      {qrConfig.account_number && (
                        <div className="flex justify-between"><span className="text-[#888888]">Cuenta:</span><strong>{qrConfig.account_number}</strong></div>
                      )}
                    </div>
                    {qrConfig.qr_image && (
                      <div className="mt-4 pt-4 border-t border-[#EEE]">
                        <img src={qrConfig.qr_image} alt="QR de pago" className="w-40 h-40 mx-auto" />
                      </div>
                    )}
                    {!qrConfig.qr_image && qrConfig.qr_code && (
                      <div className="mt-4 pt-4 border-t border-[#EEE]">
                        <p className="text-[12px] text-[#888888] text-center">Código QR: <strong>{qrConfig.qr_code}</strong></p>
                      </div>
                    )}
                    {!qrConfig.qr_image && !qrConfig.qr_code && storeProfile?.qr_code && (
                      <div className="mt-4 pt-4 border-t border-[#EEE]">
                        <img src={storeProfile.qr_code} alt="QR de pago" className="w-40 h-40 mx-auto" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-[#E74C3C] text-[13px] flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="whatsapp"
          disabled={loading}
          onClick={handleSendWhatsApp}
          className="w-full justify-center"
          size="lg"
        >
          {loading ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          )}
          {loading ? "Procesando..." : "Solicitar por WhatsApp"}
        </Button>
      </div>
    </>
  )
}
