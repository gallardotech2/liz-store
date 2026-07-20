import Link from "next/link"
import { Button } from "@/components/ui/Button"

export const dynamic = "force-dynamic"

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Pedidos</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">Gestión de pedidos de la tienda</p>
      </div>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-10 text-center">
        <p className="text-[#9CA3B8] mb-4">El módulo de pedidos estará disponible próximamente.</p>
        <Link href="/admin" prefetch={false}>
          <Button variant="secondary" size="sm">Volver al panel</Button>
        </Link>
      </div>
    </div>
  )
}
