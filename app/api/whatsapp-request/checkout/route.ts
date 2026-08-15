import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { items, name, phone, deliveryMethod, addressText, reference, notes } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
  }

  const firstItem = items[0]
  const total = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)
  const itemSummary = items.length === 1 ? firstItem.name : `${firstItem.name} y ${items.length - 1} más`

  const refCode = `PED-${String(Math.floor(100000 + Math.random() * 900000))}`

  const { data, error } = await supabase
    .from("whatsapp_requests")
    .insert({
      user_id: user?.id ?? null,
      product_id: Number(firstItem.id),
      product_name: itemSummary,
      product_image: firstItem.image || "",
      product_price: total,
      reference_code: refCode,
      notes: JSON.stringify({
        items,
        deliveryMethod,
        addressText,
        reference,
        name,
        phone,
        userNotes: notes,
      }),
    } as never)
    .select("reference_code")
    .single()

  if (error) {
    return NextResponse.json({ error: "Error al crear la solicitud" }, { status: 500 })
  }

  const result = data as unknown as { reference_code: string } | null

  return NextResponse.json({ referenceCode: result?.reference_code ?? refCode })
}
