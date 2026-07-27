"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type CustomerProfile = {
  id: string
  nombre: string
  phone: string
  created_at: string
  whatsapp_requests: Array<{
    id: number
    reference_code: string
    product_name: string
    status: string
    created_at: string
  }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  pending_payment: "Pendiente de pago",
  payment_confirmed: "Pago confirmado",
  preparing: "Preparando",
  in_package: "En paquetería",
  ready_for_pickup: "Listo para recoger",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#FFF3E0] text-[#E65100]",
  pending_payment: "bg-[#FFF8E1] text-[#F57F17]",
  payment_confirmed: "bg-[#E8F5E9] text-[#2E7D32]",
  preparing: "bg-[#E3F2FD] text-[#1565C0]",
  in_package: "bg-[#E3F2FD] text-[#1565C0]",
  ready_for_pickup: "bg-[#E8F5E9] text-[#2E7D32]",
  shipped: "bg-[#E8F5E9] text-[#2E7D32]",
  delivered: "bg-[#E8F5E9] text-[#2E7D32]",
  cancelled: "bg-[#FFEBEE] text-[#C62828]",
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from("profiles")
      .select(`
        id, nombre, phone, created_at,
        whatsapp_requests(id, reference_code, product_name, status, created_at)
      `)
      .eq("role", "customer")
      .order("created_at", { ascending: false })

    if (search.trim()) {
      query = query.ilike("nombre", `%${search.trim()}%`)
    }

    const { data } = await query
    setCustomers((data as unknown as CustomerProfile[]) || [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Clientes</h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">Gestión de clientes registrados</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-[8px] border border-white/12 bg-secondary-light text-white text-[14px] placeholder-[#9CA3B8] focus:outline-none focus:border-primary transition-colors max-sm:max-w-full max-sm:text-[16px]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[#9CA3B8]">Cargando...</div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-secondary-light border border-white/12 rounded-[16px] p-10 text-center">
          <p className="text-[#9CA3B8]">{search ? "No se encontraron clientes" : "No hay clientes registrados"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((customer) => {
            const orders = customer.whatsapp_requests || []
            const sortedOrders = [...orders].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
            return (
              <div
                key={customer.id}
                className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(customer.nombre || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold">{customer.nombre || "Sin nombre"}</div>
                      <div className="flex items-center gap-3 text-[12px] text-[#9CA3B8]">
                        {customer.phone && <span>{customer.phone}</span>}
                        <span>{new Date(customer.created_at).toLocaleDateString("es-BO")}</span>
                        <span className="font-semibold text-primary">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-[#9CA3B8] transition-transform ${expandedId === customer.id ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {expandedId === customer.id && (
                  <div className="border-t border-white/10">
                    {sortedOrders.length === 0 ? (
                      <div className="p-5 text-center text-[13px] text-[#9CA3B8]">
                        Este cliente no tiene pedidos
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-[#9CA3B8] text-left text-[12px]">
                              <th className="p-4 font-medium">Código</th>
                              <th className="p-4 font-medium">Producto</th>
                              <th className="p-4 font-medium">Fecha</th>
                              <th className="p-4 font-medium">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedOrders.map((order) => (
                              <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 text-white font-mono text-[13px]">{order.reference_code}</td>
                                <td className="p-4 text-[#9CA3B8] text-[13px]">{order.product_name}</td>
                                <td className="p-4 text-[#9CA3B8] text-[12px]">
                                  {new Date(order.created_at).toLocaleDateString("es-BO")}
                                </td>
                                <td className="p-4">
                                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                                    {STATUS_LABELS[order.status] || order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
