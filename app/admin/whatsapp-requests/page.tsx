"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WhatsappRequestStatus } from "@/types/database"

type RequestRow = {
  id: number
  reference_code: string
  status: string
  product_name: string
  product_image: string | null
  product_price: number | null
  notes: string | null
  created_at: string
  user_id: string
}

const STATUS_OPTIONS: { value: WhatsappRequestStatus; label: string }[] = [
  { value: "pending", label: "Pendiente de respuesta" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "payment_confirmed", label: "Pago confirmado" },
  { value: "preparing", label: "Preparando pedido" },
  { value: "in_package", label: "En paquetería" },
  { value: "ready_for_pickup", label: "Listo para recoger" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

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

export default function AdminWhatsAppRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<number | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from("whatsapp_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (search.trim()) {
      query = query.ilike("reference_code", `%${search.trim()}%`)
    }

    const { data } = await query
    setRequests((data as unknown as RequestRow[]) || [])
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusChange(id: number, status: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase
      .from("whatsapp_requests")
      .update({ status } as never)
      .eq("id", id)
    setUpdating(null)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Pedidos</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">
          Gestiona las solicitudes de pedido de la tienda
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código PED-XXXXXX..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-[8px] border border-white/12 bg-secondary-light text-white text-[14px] placeholder-[#9CA3B8] focus:outline-none focus:border-primary transition-colors max-sm:max-w-full max-sm:text-[16px]"
        />
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3B8]">
            {search ? "No se encontraron pedidos con ese código" : "No hay solicitudes de pedidos"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/12 text-[#9CA3B8] text-left">
                  <th className="p-4 font-medium max-sm:px-2 max-sm:py-2">Código</th>
                  <th className="p-4 font-medium max-sm:px-2 max-sm:py-2">Producto</th>
                  <th className="p-4 font-medium max-sm:hidden">Usuario</th>
                  <th className="p-4 font-medium max-sm:hidden">Fecha</th>
                  <th className="p-4 font-medium max-sm:px-2 max-sm:py-2">Estado</th>
                  <th className="p-4 font-medium max-sm:px-2 max-sm:py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-white/12 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-semibold max-sm:px-2 max-sm:py-2">
                      {req.reference_code}
                    </td>
                    <td className="p-4 max-sm:px-2 max-sm:py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-white/10 flex items-center justify-center overflow-hidden shrink-0 max-sm:w-8 max-sm:h-8">
                          {req.product_image ? (
                            <img src={req.product_image} alt={req.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3B8" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white truncate max-w-[120px] max-sm:max-w-[80px]">{req.product_name}</div>
                          {req.product_price != null && (
                            <div className="text-[#9CA3B8] text-xs">Bs. {Number(req.product_price).toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#9CA3B8] font-mono text-xs max-sm:hidden">{req.user_id.slice(0, 8)}...</td>
                    <td className="p-4 text-[#9CA3B8] text-xs max-sm:hidden">
                      {new Date(req.created_at).toLocaleDateString("es-BO")}
                    </td>
                    <td className="p-4 max-sm:px-2 max-sm:py-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_OPTIONS.find((o) => o.value === req.status)?.label || req.status}
                      </span>
                    </td>
                    <td className="p-4 max-sm:px-2 max-sm:py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          disabled={updating === req.id}
                          className="px-2.5 py-1.5 rounded-[8px] border border-white/12 bg-secondary-light text-white text-[12px] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {updating === req.id && (
                          <svg className="animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
