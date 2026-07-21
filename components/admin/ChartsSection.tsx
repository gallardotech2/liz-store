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
      .from("orders")
      .select("total")
      .eq("status", "completed")
      .gte("created_at", `${year}-${String(adjustedMonth).padStart(2, "0")}-01`)
      .lt("created_at", `${year}-${String(adjustedMonth + 1 > 12 ? 1 : adjustedMonth + 1).padStart(2, "0")}-01`)
  })

  const revenueResults = await Promise.all(revenuePromises)

  const revenueByMonth = revenueResults
    .map((r, i) => {
      const monthIdx = ((now.getMonth() - i) % 12 + 12) % 12
      return {
        month: monthsEs[monthIdx],
        total: ((r.data ?? []) as unknown as { total: number }[]).reduce((sum, o) => sum + (o.total ?? 0), 0),
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
  const totalCatProducts = catCounts.reduce((s, c) => s + c.count, 0) || 1
  const pieColors = ["#ff8e9f", "#03C9D7", "#FB9678", "#7352FF", "#27AE60", "#C9A96E", "#3498DB", "#E74C3C"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
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
          <div className="relative w-[160px] h-[160px]">
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
              <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="6" fontWeight="bold">
                {totalCatProducts}
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
    </div>
  )
}
