"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { TurnstileWidget } from "@/components/security/TurnstileWidget"
import { removeFromCartAction } from "@/app/(shop)/carrito/actions"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  stock: number
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
  storeProfile: StoreProfile | null
  user: { id: string; email: string } | null
  profile: { nombre: string; phone: string } | null
  paymentMethods: PaymentMethodInfo[]
  qrPayments: QrPaymentInfo[]
  pickupPoints: PickupPoint[]
  whatsappNumber: string
}

export function CheckoutForm({ items, storeProfile, user, profile, paymentMethods, qrPayments, pickupPoints, whatsappNumber }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "home">("pickup")
  const [pickupLocation, setPickupLocation] = useState("")
  const defaultMethod = paymentMethods.length > 0 ? paymentMethods[0].code : "pago_directo"
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod)
  const [name, setName] = useState(profile?.nombre || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [highlightName, setHighlightName] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const [highlightPhone, setHighlightPhone] = useState(false)
  const phoneRef = useRef<HTMLInputElement>(null)
  const [highlightPickup, setHighlightPickup] = useState(false)
  const pickupRef = useRef<HTMLDivElement>(null)
  const [referenceCode, setReferenceCode] = useState("")
  const [status, setStatus] = useState<"form" | "confirm" | "success">("form")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [website, setWebsite] = useState("")
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState(items)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const finalTotal = subtotal
  const mobileBarRef = useRef<HTMLDivElement>(null)
  const [mobileBarHeight, setMobileBarHeight] = useState(0)

  async function handleRemove(productId: string) {
    if (removingId) return

    setRemovingId(productId)
    setError("")

    try {
      const formData = new FormData()
      formData.append("productId", productId)
      await removeFromCartAction(formData)

      const updatedItems = cartItems.filter((item) => item.id !== productId)
      setCartItems(updatedItems)

      if (updatedItems.length === 0) {
        router.push("/carrito")
        return
      }

      router.refresh()
    } catch {
      setError("No se pudo eliminar el producto. Intenta de nuevo.")
    } finally {
      setRemovingId(null)
    }
  }

  useEffect(() => {
    setCartItems(items)
  }, [items])

  useEffect(() => {
    if (typeof window === "undefined") return

    const sent = sessionStorage.getItem("liz_whatsapp_sent")
    if (sent !== "1") return

    sessionStorage.removeItem("liz_whatsapp_sent")
    const timeoutId = window.setTimeout(() => setStatus("confirm"), 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const node = mobileBarRef.current
    if (!node) return

    const updateHeight = () => {
      setMobileBarHeight(node.getBoundingClientRect().height)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  function buildWhatsAppMessage(codeOverride?: string): string {
    const deliveryInfo = deliveryMethod === "pickup"
      ? `📍 Recoger en: ${pickupLocation}`
      : `🚚 Envío a domicilio - Pendiente de coordinar por WhatsApp`

    const itemsText = cartItems
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
    const code = codeOverride ?? referenceCode
    if (code) msg += `\n🔖 *Código:* ${code}\n`
    msg += "\n━━━━━━━━━━━━━━━━\n"
      + "✅ *Solicitud enviada desde Liz Store*"
    return msg
  }

  function validate(): boolean {
    if (!name.trim()) {
      setError("Ingresa tu nombre")
      setHighlightName(true)
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      window.setTimeout(() => setHighlightName(false), 2500)
      return false
    }
    if (!phone.trim()) {
      setError("Ingresa tu teléfono")
      setHighlightPhone(true)
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      window.setTimeout(() => setHighlightPhone(false), 2500)
      return false
    }
    if (deliveryMethod === "pickup" && !pickupLocation) {
      setError("Te falta seleccionar tu punto de recogida")
      setHighlightPickup(true)
      pickupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      window.setTimeout(() => setHighlightPickup(false), 2500)
      return false
    }
    return true
  }

  function sendWhatsAppMsg() {
    const msg = buildWhatsAppMessage()
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, "_blank")
  }

  async function handleSendWhatsApp() {
    setError("")
    if (!validate()) return

    if (website.trim()) {
      setError("Solicitud inválida")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/whatsapp-request/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            id: i.id,
            price: i.price,
            quantity: i.quantity,
          })),
          name: name.trim(),
          phone,
          website,
          turnstileToken,
          deliveryMethod,
          addressText: deliveryMethod === "home" ? "Pendiente de coordinar" : (() => { const p = pickupPoints.find(p => p.name === pickupLocation); return p ? `${p.name} - ${p.address}` : pickupLocation })(),
          reference: "",
          notes,
          paymentMethod,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Error al crear la solicitud")
        setTurnstileReset((value) => value + 1)
        return
      }

      const code = data.referenceCode || ""
      if (code) setReferenceCode(code)

      const msg = buildWhatsAppMessage(code)
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`
      sessionStorage.setItem("liz_whatsapp_sent", "1")
      window.open(whatsappUrl, "_blank")

      setStatus("success")
      setTurnstileReset((value) => value + 1)
    } catch {
      setError("No pudimos registrar tu solicitud. Revisa tu conexión e intenta de nuevo.")
      setTurnstileReset((value) => value + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {status === "success" && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setStatus("form")}>
          <div
            className="relative bg-white dark:bg-surface-elevated rounded-[20px] p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setStatus("form")}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-[#6B6B6B] dark:text-ink-soft bg-transparent border-none cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-white/10 hover:text-[#2D2D2D] dark:hover:text-ink-strong"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="text-[#27AE60] text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-serif text-[#2D2D2D] dark:text-ink-strong mb-3">Pedido solicitado correctamente</h3>
            {referenceCode && (
              <div className="mb-4 p-3 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)]">
                <p className="text-[12px] text-[#6B6B6B] dark:text-ink-soft mb-1">Código de referencia</p>
                <p className="text-lg font-bold text-[#2D2D2D] dark:text-ink-strong tracking-wider">{referenceCode}</p>
              </div>
            )}
            <div className="text-left mb-6 p-4 rounded-xl bg-[#FDF8F6] dark:bg-surface">
              <p className="text-[14px] font-semibold text-[#2D2D2D] dark:text-ink-strong mb-2">Resumen del pedido</p>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5 text-[13px] text-[#6B6B6B] dark:text-ink-soft">
                  <span className="text-[#2D2D2D] dark:text-ink-strong font-medium">{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
            {user && (
              <button
                onClick={() => router.push("/perfil/historial")}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white font-semibold text-sm border-none cursor-pointer hover:-translate-y-0.5 transition-all mb-3 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Ver pedido
              </button>
            )}
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
            className="bg-white dark:bg-surface-elevated rounded-[20px] p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#27AE60] text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-serif text-[#2D2D2D] dark:text-ink-strong mb-3">✅ Tu solicitud fue enviada correctamente.</h3>
            <p className="text-sm text-[#6B6B6B] dark:text-ink-soft mb-6 leading-[1.6]">
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
              className="text-sm text-[#6B6B6B] dark:text-ink-soft bg-transparent border-none cursor-pointer hover:text-[#2D2D2D] dark:hover:text-ink-strong transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div id="datos-contacto" className="scroll-mt-24 bg-white dark:bg-surface-raised rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)] md:order-1">
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <h2 className="text-lg font-serif text-[#2D2D2D] dark:text-ink-strong mb-6">Datos de contacto</h2>

        {user && profile && (
          <div className="mb-5 p-3.5 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)] text-[13px] text-[#6B6B6B] dark:text-ink-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 -mt-0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Tus datos se cargaron automáticamente desde tu perfil.
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[13px] text-[#6B6B6B] dark:text-ink-soft font-medium">Nombre completo *</label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (highlightName) setHighlightName(false)
            }}
            required
            maxLength={100}
            placeholder={user ? "Cargando..." : "Tu nombre"}
            className={`px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] dark:bg-surface border text-[#2D2D2D] dark:text-ink-strong text-sm outline-none focus:border-primary transition-all duration-300 w-full ${
              highlightName
                ? "border-[#E74C3C] ring-4 ring-[#E74C3C]/25"
                : "border-[#EEE] dark:border-line"
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[13px] text-[#6B6B6B] dark:text-ink-soft font-medium">Teléfono *</label>
          <input
            ref={phoneRef}
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (highlightPhone) setHighlightPhone(false)
            }}
            required
            maxLength={30}
            aria-invalid={highlightPhone}
            placeholder={user ? "Cargando..." : "Número de contacto"}
            className={`px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] dark:bg-surface border text-[#2D2D2D] dark:text-ink-strong text-sm outline-none focus:border-primary transition-all duration-300 w-full ${
              highlightPhone
                ? "border-[#E74C3C] ring-4 ring-[#E74C3C]/25"
                : "border-[#EEE] dark:border-line"
            }`}
          />
        </div>

        <h2 className="text-lg font-serif text-[#2D2D2D] dark:text-ink-strong mb-6 mt-10" style={{ marginTop: 40 }}>
          🚚 Método de entrega
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          <label
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              deliveryMethod === "pickup"
                ? "border-primary bg-[rgba(255,142,159,0.06)]"
                : "border-[#EEE] dark:border-line bg-white dark:bg-surface-raised hover:border-[#DDD] dark:hover:border-line"
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
              <div className="font-semibold text-sm text-[#2D2D2D] dark:text-ink-strong">Recoger en paquetería</div>
              <div className="text-[13px] text-[#6B6B6B] dark:text-ink-soft">Pasas a recoger tu pedido por nuestra dirección</div>
              <span className="inline-block mt-1 text-[11px] font-bold text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-2 py-0.5 rounded">GRATIS</span>
            </div>
          </label>

          <label
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              deliveryMethod === "home"
                ? "border-primary bg-[rgba(255,142,159,0.06)]"
                : "border-[#EEE] dark:border-line bg-white dark:bg-surface-raised hover:border-[#DDD] dark:hover:border-line"
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
              <div className="font-semibold text-sm text-[#2D2D2D] dark:text-ink-strong">Envío a domicilio</div>
              <div className="text-[13px] text-[#6B6B6B] dark:text-ink-soft">Cotiza tu envío por WhatsApp</div>
            </div>
          </label>
        </div>

        {deliveryMethod === "pickup" && (
          <div
            ref={pickupRef}
            id="punto-recogida"
            className={`mb-6 p-5 rounded-xl bg-[#FDF8F6] dark:bg-surface border-2 scroll-mt-24 transition-all duration-300 ${
              highlightPickup
                ? "border-[#E74C3C] ring-4 ring-[#E74C3C]/25"
                : "border-transparent"
            }`}
          >
            <p className="text-[14px] text-[#6B6B6B] dark:text-ink-soft mb-4">
              Selecciona el punto de recogida más cercano a ti.
            </p>
            <div className="flex flex-col gap-2">
              {pickupPoints.length === 0 && (
                <p className="text-[13px] text-[#6B6B6B] dark:text-ink-soft">No hay puntos de recogida disponibles.</p>
              )}
              {pickupPoints.map((point) => (
                <div key={point.id}>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      pickupLocation === point.name
                        ? "bg-white dark:bg-surface-raised border border-primary"
                        : "bg-white dark:bg-surface-raised border border-[#EEE] dark:border-line hover:border-[#DDD] dark:hover:border-line"
                    }`}
                    onClick={() => {
                      setPickupLocation(point.name)
                      setHighlightPickup(false)
                    }}
                  >
                    <input
                      type="radio"
                      name="pickup_location"
                      value={point.name}
                      checked={pickupLocation === point.name}
                      onChange={() => {
                        setPickupLocation(point.name)
                        setHighlightPickup(false)
                      }}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#2D2D2D] dark:text-ink-strong">{point.name}</div>
                      <div className="text-[12px] text-[#6B6B6B] dark:text-ink-soft">{point.address}</div>
                      <div className="text-[12px] text-[#6B6B6B] dark:text-ink-soft mt-0.5">{point.schedule}</div>
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
          <div className="mb-6 p-5 rounded-xl bg-[#FDF8F6] dark:bg-surface">
            <p className="text-[14px] text-[#6B6B6B] dark:text-ink-soft">
              El costo y la disponibilidad del envío se coordinarán directamente por WhatsApp.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-[13px] text-[#6B6B6B] dark:text-ink-soft font-medium">Notas adicionales</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Alguna nota especial para tu pedido..."
            className="px-3.5 py-2.5 rounded-xl bg-[#FDF8F6] dark:bg-surface border border-[#EEE] dark:border-line text-[#2D2D2D] dark:text-ink-strong text-sm outline-none focus:border-primary transition-colors w-full resize-y"
          />
        </div>

        <h2 className="text-lg font-serif text-[#2D2D2D] dark:text-ink-strong mb-6 mt-10" style={{ marginTop: 40 }}>
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
                      : "border-[#EEE] dark:border-line bg-white dark:bg-surface-raised hover:border-[#DDD] dark:hover:border-line"
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
                    <div className="font-semibold text-sm text-[#2D2D2D] dark:text-ink-strong">{pm.icon} {pm.name}</div>
                    {pm.description && (
                      <div className="text-[13px] text-[#6B6B6B] dark:text-ink-soft">{pm.description}</div>
                    )}
                  </div>
                </label>
                {paymentMethod === pm.code && qrConfig && (
                  <div className="mt-3 p-5 rounded-xl bg-[#FDF8F6] dark:bg-surface border border-[#EEE] dark:border-line">
                    <div className="space-y-1.5 text-[13px] text-[#2D2D2D] dark:text-ink-strong">
                      {qrConfig.account_name && (
                        <div className="flex justify-between"><span className="text-[#6B6B6B] dark:text-ink-soft">Titular:</span><strong>{qrConfig.account_name}</strong></div>
                      )}
                      {qrConfig.bank_name && (
                        <div className="flex justify-between"><span className="text-[#6B6B6B] dark:text-ink-soft">Banco:</span><strong>{qrConfig.bank_name}</strong></div>
                      )}
                      {qrConfig.account_number && (
                        <div className="flex justify-between"><span className="text-[#6B6B6B] dark:text-ink-soft">Cuenta:</span><strong>{qrConfig.account_number}</strong></div>
                      )}
                    </div>
                    {qrConfig.qr_image && (
                      <div className="mt-4 pt-4 border-t border-[#EEE] dark:border-line">
                        <img src={qrConfig.qr_image} alt="QR de pago" className="w-40 h-40 mx-auto" />
                      </div>
                    )}
                    {!qrConfig.qr_image && qrConfig.qr_code && (
                      <div className="mt-4 pt-4 border-t border-[#EEE] dark:border-line">
                        <p className="text-[12px] text-[#6B6B6B] dark:text-ink-soft text-center">Código QR: <strong>{qrConfig.qr_code}</strong></p>
                      </div>
                    )}
                    {!qrConfig.qr_image && !qrConfig.qr_code && storeProfile?.qr_code && (
                      <div className="mt-4 pt-4 border-t border-[#EEE] dark:border-line">
                        <img src={storeProfile.qr_code} alt="QR de pago" className="w-40 h-40 mx-auto" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <TurnstileWidget
          action="checkout"
          onToken={setTurnstileToken}
          resetKey={turnstileReset}
        />

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-[#E74C3C] dark:text-[#FF8A80] text-[13px] flex items-start gap-2 max-md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="whatsapp"
          disabled={loading}
          onClick={handleSendWhatsApp}
          className="w-full justify-center max-md:hidden"
          size="lg"
        >
          {loading ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          )}
          {loading ? "Procesando..." : "Solicitar por WhatsApp"}
        </Button>

        <div aria-hidden="true" className="md:hidden" style={{ height: mobileBarHeight }} />
      </div>

      <div
        ref={mobileBarRef}
        className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[60] rounded-t-xl bg-white/85 glass-dark backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="px-3.5 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[11px] font-semibold uppercase tracking-[1px] text-[#6B6B6B] dark:text-ink-soft">
              Resumen del pedido
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-[#2D2D2D] dark:text-ink-strong">
              Subtotal Bs. {subtotal.toFixed(2)}
            </span>
          </div>

          <div
            id="mobile-order-summary-items"
            className={`mt-1.5 ${summaryExpanded ? "max-h-[min(30dvh,180px)] overflow-y-auto overscroll-contain" : ""}`}
          >
            {cartItems.slice(0, summaryExpanded ? cartItems.length : 2).map((item) => {
              const lineTotal = item.price * item.quantity
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 border-b border-[#F5F5F5] py-1.5 last:border-b-0 dark:border-line-faint"
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[#FFFBF9] dark:bg-surface">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[rgb(251,132,150)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#2D2D2D] dark:text-ink-strong">{item.name}</p>
                    <p className="text-[10.5px] text-[#6B6B6B] dark:text-ink-soft">x{item.quantity}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold text-primary">
                    Bs. {lineTotal.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId !== null}
                    aria-label={`Eliminar ${item.name} del pedido`}
                    className="flex shrink-0 cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-[10.5px] font-medium text-[#E74C3C] transition-colors hover:text-[#C0392B] disabled:cursor-wait disabled:opacity-50 dark:text-[#FF8A80] dark:hover:text-[#EF9A9A]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {removingId === item.id ? "..." : "Eliminar"}
                  </button>
                </div>
              )
            })}
          </div>

          {cartItems.length > 2 && (
            <button
              type="button"
              onClick={() => setSummaryExpanded((value) => !value)}
              aria-expanded={summaryExpanded}
              aria-controls="mobile-order-summary-items"
              className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#EEE] bg-[#FDF8F6] px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:border-primary/40 dark:border-line dark:bg-surface"
            >
              {summaryExpanded ? "Ver menos" : `Mostrar ${cartItems.length - 2} más`}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${summaryExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>

        <div className="border-t border-[#EEE] px-3.5 pb-2.5 pt-2 dark:border-line">
          {error && (
            <div className="mb-2 text-[12px] text-[#E74C3C] dark:text-[#FF8A80] text-center">{error}</div>
          )}
          <Button
            type="button"
            variant="whatsapp"
            disabled={loading}
            onClick={handleSendWhatsApp}
            className="w-full justify-center"
            size="md"
          >
            {loading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            )}
            {loading ? "Procesando..." : "Solicitar por WhatsApp"}
          </Button>
        </div>
      </div>
    </>
  )
}
