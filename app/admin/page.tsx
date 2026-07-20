import { createClient } from "@/lib/supabase/server"
import { MetricCard } from "@/components/admin/MetricCard"
import { ChartsSection } from "@/components/admin/ChartsSection"
import Link from "next/link"
import { BoxIcon, CartIcon, UsersIcon, ExternalLinkIcon, DollarIcon } from "@/components/admin/Icons"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { count: completedOrders },
    { count: totalUsers },
    { count: totalCategories },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("total").eq("status", "completed"),
  ])

  const totalRevenue = (revenueData as unknown as { total: number }[])?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

  return (
    <>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-7 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex items-center justify-between flex-wrap gap-4 max-sm:p-4 max-sm:flex-col max-sm:text-center">
        <div>
          <h2 className="text-2xl font-bold text-white m-0 mb-1 max-sm:text-lg">Bienvenido a Liz Store ✦</h2>
          <p className="text-sm text-[#9CA3B8] m-0 max-sm:text-[13px]">
            Panel de administración — gestiona productos, pedidos, usuarios y más.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl no-underline transition-all hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(183,110,121,0.2)] max-sm:self-stretch max-sm:justify-center"
          prefetch={false}
        >
          <ExternalLinkIcon />
          Ver tienda
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 mb-7 max-md:grid-cols-2 max-sm:gap-3">
        <MetricCard
          icon={<BoxIcon className="w-5 h-5" />}
          value={activeProducts ?? 0}
          label="Productos activos"
          trend={`+${totalProducts ?? 0}`}
          accentColor="#B76E79"
        />
        <MetricCard
          icon={<CartIcon className="w-5 h-5" />}
          value={totalOrders ?? 0}
          label="Pedidos totales"
          trend={`${pendingOrders ?? 0} pend.`}
          accentColor="#FB9678"
        />
        <MetricCard
          icon={<DollarIcon className="w-5 h-5" />}
          value={`Bs. ${totalRevenue.toFixed(0)}`}
          label="Ingresos"
          trend={`${completedOrders ?? 0} compl.`}
          accentColor="#27AE60"
        />
        <MetricCard
          icon={<UsersIcon className="w-5 h-5" />}
          value={totalUsers ?? 0}
          label="Usuarios registrados"
          trend={`${totalCategories ?? 0} cat.`}
          accentColor="#03C9D7"
        />
      </div>

      <ChartsSection />
    </>
  )
}
