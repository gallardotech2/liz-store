import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { createClient } from "@/lib/supabase/server"
import {
  buildProductsWorkbook,
  fetchProductsForExport,
  getExportFilename,
} from "@/lib/products-export"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  await requireAdmin()

  try {
    const supabase = await createClient()
    const products = await fetchProductsForExport(supabase)

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No hay productos para exportar." },
        { status: 404 },
      )
    }

    const generatedAt = new Date()
    const workbook = buildProductsWorkbook(products, generatedAt)
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = getExportFilename(generatedAt)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[admin/products/export] No se pudo generar el Excel", error)
    return NextResponse.json(
      { error: "No se pudo generar el Excel. Inténtalo de nuevo." },
      { status: 500 },
    )
  }
}
