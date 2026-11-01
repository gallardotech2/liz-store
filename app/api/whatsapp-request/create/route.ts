import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import { parseCartItems, repriceCart, type ProductForValidation } from "@/lib/whatsapp/validation"
import { insertWhatsappRequest } from "@/lib/whatsapp/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(`whatsapp:create:${clientIp}`, 10, 60)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    )
  }

  let body: Record<string, unknown> | null
  try {
    const raw = await request.json()
    body = raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (!body) {
    return NextResponse.json({ error: "Faltan datos del producto" }, { status: 400 })
  }

  const parsedItems = parseCartItems([{ id: body.productId, quantity: 1 }])
  if (!parsedItems.ok) {
    return NextResponse.json({ error: "Faltan datos del producto" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const productId = parsedItems.data[0].id
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price, discount_price, stock, product_images(image, is_main)")
    .eq("id", productId)
    .eq("is_active", true)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 400 })
  }

  const priced = repriceCart(parsedItems.data, [product as ProductForValidation])
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error, code: priced.code }, { status: 400 })
  }

  const item = priced.data.items[0]

  let admin
  try {
    admin = createServiceClient()
  } catch (error) {
    console.error("[whatsapp-create] service client", error)
    return NextResponse.json(
      { error: "El servidor no está configurado para procesar solicitudes. Intenta más tarde." },
      { status: 503 },
    )
  }

  try {
    const { referenceCode } = await insertWhatsappRequest(admin, {
      user_id: user?.id ?? null,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      product_price: item.subtotal,
      notes: "",
    })

    return NextResponse.json({ referenceCode, guest: !user })
  } catch (error) {
    console.error("[whatsapp-create] insert", error)
    return NextResponse.json(
      { error: "Error al crear la solicitud" },
      { status: 500 },
    )
  }
}
