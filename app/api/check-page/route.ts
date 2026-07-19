import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: categories, error: catErr } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true)
      .order("order")

    const { data: featured, error: featErr } = await supabase
      .from("products")
      .select("id, name, slug, price")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(8)

    const { data: allProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, is_active, is_featured")
      .limit(20)

    return NextResponse.json({
      ok: !catErr && !featErr,
      categories: categories ?? [],
      categoriesCount: categories?.length ?? 0,
      categoriesError: catErr ? { code: catErr.code, message: catErr.message } : null,
      featured: featured ?? [],
      featuredCount: featured?.length ?? 0,
      featuredError: featErr ? { code: featErr.code, message: featErr.message } : null,
      allProducts: allProducts ?? [],
      allProductsCount: allProducts?.length ?? 0,
      allProductsError: prodErr ? { code: prodErr.code, message: prodErr.message } : null,
      auth: await supabase.auth.getSession().then(s => ({ hasSession: !!s.data.session })),
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }
}
