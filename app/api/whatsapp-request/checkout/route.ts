import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/security/turnstile"
import {
  isHoneypot,
  parseCartItems,
  parseContact,
  repriceCart,
  type ProductForValidation,
} from "@/lib/whatsapp/validation"
import { insertWhatsappRequest } from "@/lib/whatsapp/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(`whatsapp:checkout:${clientIp}`, 5, 60)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (isHoneypot(body)) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const turnstile = await verifyTurnstile(
    (body as Record<string, unknown> | null)?.turnstileToken,
    clientIp,
    "checkout",
  )
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "No pudimos verificar que eres una persona. Recarga e intenta de nuevo." },
      { status: 403 },
    )
  }

  const parsedItems = parseCartItems((body as Record<string, unknown> | null)?.items)
  if (!parsedItems.ok) {
    return NextResponse.json({ error: parsedItems.error, code: parsedItems.code }, { status: 400 })
  }

  const parsedContact = parseContact(body)
  if (!parsedContact.ok) {
    return NextResponse.json({ error: parsedContact.error, code: parsedContact.code }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const productIds = parsedItems.data.map((item) => item.id)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, discount_price, stock, product_images(image, is_main)")
    .in("id", productIds)
    .eq("is_active", true)

  if (productsError) {
    console.error("[whatsapp-checkout] products", productsError)
    return NextResponse.json({ error: "No pudimos validar tu carrito. Intenta de nuevo." }, { status: 500 })
  }

  const priced = repriceCart(
    parsedItems.data,
    (products ?? []) as ProductForValidation[],
  )
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error, code: priced.code }, { status: priced.code === "PRICE_CHANGED" ? 409 : 400 })
  }

  const { items, subtotal, total } = priced.data
  const firstItem = items[0]
  const contact = parsedContact.data
  const itemSummary = items.length === 1 ? firstItem.name : `${firstItem.name} y ${items.length - 1} más`

  let admin
  try {
    admin = createServiceClient()
  } catch (error) {
    console.error("[whatsapp-checkout] service client", error)
    return NextResponse.json(
      { error: "El servidor no está configurado para procesar solicitudes. Intenta más tarde." },
      { status: 503 },
    )
  }

  try {
    const { referenceCode } = await insertWhatsappRequest(admin, {
      user_id: user?.id ?? null,
      product_id: firstItem.id,
      product_name: itemSummary,
      product_image: firstItem.image,
      product_price: subtotal,
      notes: JSON.stringify({
        items,
        deliveryMethod: contact.deliveryMethod,
        addressText: contact.addressText,
        reference: contact.reference,
        name: contact.name,
        phone: contact.phone,
        paymentMethod: contact.paymentMethod,
        subtotal,
        total,
        userNotes: contact.notes,
      }),
    })

    return NextResponse.json({
      referenceCode,
      totals: { subtotal, total },
    })
  } catch (error) {
    console.error("[whatsapp-checkout] insert", error)
    return NextResponse.json(
      { error: "Error al crear la solicitud. Intenta de nuevo." },
      { status: 500 },
    )
  }
}
