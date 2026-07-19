import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const results: {
    env: Record<string, unknown>
    tables: Record<string, unknown>
    errors: string[]
    summary?: Record<string, unknown>
  } = {
    env: {
      hasUrl: !!url,
      hasAnonKey: !!anonKey,
      anonKeyPreview: anonKey ? anonKey.slice(0, 20) + "..." : "MISSING",
      hasServiceKey: !!serviceKey,
      serviceKeyPreview: serviceKey ? serviceKey.slice(0, 15) + "..." : "MISSING",
    },
    tables: {},
    errors: [],
  }

  if (!url || !anonKey) {
    results.errors.push("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local")
    return NextResponse.json(results, { status: 500 })
  }

  const supabase = createClient(url, anonKey)
  const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null

  const tables = [
    "categories",
    "products",
    "product_images",
    "orders",
    "order_items",
    "transactions",
    "payment_methods",
    "qr_payments",
    "reviews",
    "store_profiles",
    "live_sessions",
    "profiles",
    "addresses",
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })

      const tableInfo: Record<string, unknown> = {
        exists: !error || error.code !== "42P01",
        count: count ?? 0,
        error: error ? { code: error.code, message: error.message } : null,
      }

      if (error && error.code === "42P01") {
        tableInfo.exists = false
      }

      if (supabaseAdmin) {
        const { count: adminCount, error: adminError } = await supabaseAdmin
          .from(table)
          .select("*", { count: "exact", head: true })

        tableInfo.adminCount = adminError ? null : adminCount
        tableInfo.adminError = adminError ? { code: adminError.code } : null
      }

      ;(results.tables as Record<string, unknown>)[table] = tableInfo
    } catch (e) {
      results.errors.push(`Error checking ${table}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const hasData = Object.values(results.tables as Record<string, unknown>).some(
    (t: unknown) => (t as Record<string, unknown>).count && Number((t as Record<string, unknown>).count) > 0,
  )

  results.summary = {
    totalTables: tables.length,
    tablesWithData: Object.entries(results.tables as Record<string, unknown>).filter(
      ([, t]) => Number((t as Record<string, unknown>).count) > 0,
    ).length,
    hasData,
    connectionOk: results.errors.length === 0,
  }

  return NextResponse.json(results)
}
