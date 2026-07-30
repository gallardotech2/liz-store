import { createClient } from "@/lib/supabase/server"
import { getUserRequests } from "@/lib/queries/whatsapp-requests"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de respuesta",
  pending_payment: "Pendiente de pago",
  payment_confirmed: "Pago confirmado",
  preparing: "Preparando pedido",
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

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: requests } = await getUserRequests(supabase, user.id)

  return (
    <section className="min-h-[80vh] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/perfil" className="text-primary no-underline hover:underline text-sm">
            ← Volver al perfil
          </Link>
        </div>

        <h1 className="text-[clamp(24px,3vw,32px)] font-serif mb-8 text-[#2D2D2D]">
          Mis solicitudes
        </h1>

        {!requests || requests.length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <p className="text-[#6B6B6B]">No tienes solicitudes por WhatsApp</p>
            <Link href="/productos" className="text-primary font-semibold no-underline hover:underline text-sm mt-2 inline-block">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req: any) => (
              <div
                key={req.id}
                className="bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[rgba(255,142,159,0.05)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] text-[#6B6B6B]">Código</span>
                    <p className="font-semibold text-[#2D2D2D]">{req.reference_code}</p>
                  </div>
                  <span className={`text-[12px] px-2.5 py-1 rounded font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 py-2 border-t border-[#F5F5F5]">
                  <div className="w-16 h-16 rounded-[8px] bg-[#FFFBF9] flex items-center justify-center text-[12px] text-[#6B6B6B] overflow-hidden shrink-0">
                    {req.product_image ? (
                      <img src={req.product_image} alt={req.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-[#2D2D2D] font-medium">{req.product_name}</p>
                    {req.product_price != null && (
                      <p className="text-[13px] text-[#6B6B6B]">{formatCurrency(req.product_price)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F5F5F5] text-[13px] text-[#6B6B6B]">
                  {new Date(req.created_at).toLocaleDateString("es-BO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
