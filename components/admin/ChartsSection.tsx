import { createClient } from "@/lib/supabase/server"

export async function ChartsSection() {
  const supabase = await createClient()

  const now = new Date()
  const monthsEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  const revenuePromises = Array.from({ length: 6 }, (_, i) => {
    const m = now.getMonth() - i
    const month = ((m % 12) + 12) % 12
    const year = now.getFullYear() + (m < 0 ? -1 : 0) + (month > now.getMonth() && i > 0 ? -1 : 0)
    const adjustedMonth = month + 1
    return supabase
      .from("whatsapp_requests")
      .select("product_price")
      .in("status", ["payment_confirmed"])
      .gte("created_at", `${year}-${String(adjustedMonth).padStart(2, "0")}-01`)
      .lt("created_at", `${year}-${String(adjustedMonth + 1 > 12 ? 1 : adjustedMonth + 1).padStart(2, "0")}-01`)
  })

  const revenueResults = await Promise.all(revenuePromises)

  const revenueByMonth = revenueResults
    .map((r, i) => {
      const monthIdx = ((now.getMonth() - i) % 12 + 12) % 12
      return {
        month: monthsEs[monthIdx],
        total: ((r.data ?? []) as unknown as { product_price: number }[]).reduce((sum, o) => sum + (o.product_price ?? 0), 0),
      }
    })
    .reverse()

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.total), 1)

  const { data: rawCategoryData } = await supabase
    .from("categories")
    .select("name, id")
    .eq("is_active", true)

  const categoryData = rawCategoryData as unknown as { name: string; id: number }[] | null

  const catCountPromises = (categoryData ?? []).map(async (cat) => {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cat.id)
      .eq("is_active", true)
    return { label: cat.name, count: count ?? 0 }
  })

  const catCounts = await Promise.all(catCountPromises)
  const totalActiveProducts = (await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true)).count ?? 0
  const totalCatProducts = catCounts.reduce((s, c) => s + c.count, 0) || 1
  const pieColors = ["#ff8e9f", "#03C9D7", "#FB9678", "#7352FF", "#27AE60", "#C9A96E", "#3498DB", "#E74C3C"]

  const { data: rawNotesData } = await supabase
    .from("whatsapp_requests")
    .select("notes")

  const notesList = (rawNotesData ?? []) as unknown as { notes: string }[]

  let pickupCount = 0
  let homeCount = 0
  const pickupPoints: Record<string, number> = {}

  for (const entry of notesList) {
    if (!entry.notes) continue
    try {
      const parsed = JSON.parse(entry.notes)
      const method: string = parsed.deliveryMethod || ""
      const addressText: string = (parsed.addressText || "").trim()

      if (method === "home") {
        homeCount++
      } else if (method === "pickup") {
        pickupCount++
        if (addressText) pickupPoints[addressText] = (pickupPoints[addressText] || 0) + 1
      }
    } catch {}
  }

  const totalDelivery = pickupCount + homeCount || 1
  const sortedPickupPoints = Object.entries(pickupPoints).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 max-sm:gap-3">
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] max-sm:p-4">
        <h3 className="text-base font-bold text-white m-0 mb-4 flex items-center gap-2">
          <span style={{ color: "#ff8e9f" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          Ingresos mensuales
        </h3>
        <div className="w-full h-[220px] flex items-end gap-2 pt-4">
          {revenueByMonth.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-[#9CA3B8] font-medium">Bs.{m.total.toFixed(0)}</span>
              <div
                className="w-full rounded-[4px] transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${Math.max((m.total / maxRevenue) * 160, 8)}px`,
                  background: "linear-gradient(180deg, #ff8e9f, rgba(255,142,159,0.4))",
                }}
              />
              <span className="text-[10px] text-[#ABB2BF]">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <h3 className="text-base font-bold text-white m-0 mb-4 flex items-center gap-2">
          <span style={{ color: "#03C9D7" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          Productos por categoría
        </h3>
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="relative w-[160px] h-[160px] max-sm:w-[120px] max-sm:h-[120px]">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {catCounts.map((cat, i) => {
                const pct = cat.count / totalCatProducts
                const offset = catCounts
                  .slice(0, i)
                  .reduce((s, c) => s + (c.count / totalCatProducts) * 360, 0)
                return (
                  <circle
                    key={cat.label}
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke={pieColors[i % pieColors.length]}
                    strokeWidth="3"
                    strokeDasharray={`${pct * 360} ${(1 - pct) * 360}`}
                    strokeDashoffset={-offset}
                  />
                )
              })}
              <circle cx="18" cy="18" r="11" fill="#33373E" />
              <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="6" fontWeight="bold" transform="rotate(90 18 18)">
                {totalActiveProducts}
              </text>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            {catCounts.slice(0, 6).map((cat, i) => (
              <div key={cat.label} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: pieColors[i % pieColors.length] }}
                />
                <span className="text-[#ABB2BF]">{cat.label}</span>
                <span className="text-white font-semibold ml-auto">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <h3 className="text-base font-bold text-white m-0 mb-4 flex items-center gap-2">
          <span style={{ color: "#C9A96E" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
            </svg>
          </span>
          Origen de pedidos
        </h3>
        <div className="flex items-center justify-center gap-8 pt-2 max-sm:gap-4">
          <div className="relative w-[140px] h-[140px] shrink-0 max-sm:w-[110px] max-sm:h-[110px]">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#C9A96E" strokeWidth="3" strokeDasharray={`${(pickupCount / totalDelivery) * 360} ${(1 - pickupCount / totalDelivery) * 360}`} strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ff8e9f" strokeWidth="3" strokeDasharray={`${(homeCount / totalDelivery) * 360} ${(1 - homeCount / totalDelivery) * 360}`} strokeDashoffset={`${-(pickupCount / totalDelivery) * 360}`} />
              <circle cx="18" cy="18" r="11" fill="#33373E" />
              <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="6" fontWeight="bold" transform="rotate(90 18 18)">
                {pickupCount + homeCount}
              </text>
            </svg>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#C9A96E" }} />
              <span className="text-[#ABB2BF]">Recoger</span>
              <span className="text-white font-semibold ml-auto">{pickupCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#ff8e9f" }} />
              <span className="text-[#ABB2BF]">Envío a domicilio</span>
              <span className="text-white font-semibold ml-auto">{homeCount}</span>
            </div>
            {sortedPickupPoints.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <span className="text-[11px] text-[#9CA3B8] font-medium uppercase tracking-wider">Puntos de recogida</span>
                {sortedPickupPoints.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                      <span className="text-[#ABB2BF] text-xs truncate max-w-[150px]">{name}</span>
                    <span className="text-white font-semibold text-xs ml-auto">{count}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
