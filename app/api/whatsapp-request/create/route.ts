import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })
  }

  const body = await request.json()
  const { productId, productName, productImage, productPrice } = body

  if (!productId || !productName) {
    return NextResponse.json({ error: "Faltan datos del producto" }, { status: 400 })
  }

  const refCode = `PED-${String(Math.floor(100000 + Math.random() * 900000))}`

  const { data, error } = await supabase
    .from("whatsapp_requests")
    .insert({
      user_id: user.id,
      product_id: Number(productId),
      product_name: productName,
      product_image: productImage || "",
      product_price: productPrice ? Number(productPrice) : null,
      reference_code: refCode,
    } as never)
    .select("reference_code")
    .single()

  if (error) {
    return NextResponse.json({ error: "Error al crear la solicitud" }, { status: 500 })
  }

  const result = data as unknown as { reference_code: string } | null

  return NextResponse.json({ referenceCode: result?.reference_code ?? refCode })
}
