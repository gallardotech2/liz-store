import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { ImageDropzone } from "@/components/admin/ImageDropzone"
import {
  updateLiveSession,
  deleteLiveSession,
  addProductToLiveSession,
  removeProductFromLiveSession,
  setCurrentLiveProduct,
} from "../../actions"
import { ArrowLeftIcon, BroadcastIcon, PlayCircleIcon, PauseIcon, StopIcon, XIcon } from "@/components/admin/Icons"

export const revalidate = 0

interface LiveSessionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditLiveSessionPage({ params }: LiveSessionPageProps) {
  const { id } = await params
  const liveSessionId = Number(id)

  if (isNaN(liveSessionId)) redirect("/admin/lives")

  const supabase = await createClient()

  const { data: session } = await (supabase as any)
    .from("live_sessions")
    .select(`
      *,
      store_profiles(name),
      live_session_products(
        product_id,
        order,
        products(id, name, price, discount_price, product_images(image, is_main))
      )
    `)
    .eq("id", liveSessionId)
    .single()

  if (!session) redirect("/admin/lives")

  const { data: products } = await (supabase as any)
    .from("products")
    .select("id, name, price, discount_price, product_images(image, is_main)")
    .eq("is_active", true)
    .order("name")

  const { data: stores } = await (supabase as any)
    .from("store_profiles")
    .select("id, name")
    .order("name")

  const statusConfig = {
    not_started: { label: "No iniciada", color: "bg-[#9CA3B8]", icon: <PlayCircleIcon className="w-4 h-4" /> },
    live: { label: "EN VIVO", color: "bg-[#E74C3C] animate-pulse", icon: <span className="w-2 h-2 rounded-full bg-white" /> },
    paused: { label: "Pausada", color: "bg-[#C9A96E]", icon: <PauseIcon className="w-4 h-4" /> },
    ended: { label: "Finalizada", color: "bg-[#27AE60]", icon: <StopIcon className="w-4 h-4" /> },
  }

  const cfg = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.not_started

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/lives" prefetch={false}>
            <Button variant="secondary" size="sm">
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">
              {session.title}
              <span className="text-[10px] bg-[#C9A96E] text-white px-1.5 py-0.5 rounded ml-2 font-semibold">BETA</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {cfg.icon}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color} text-white`}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/admin/lives/${liveSessionId}/studio`}
          className="px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors no-underline"
          prefetch={false}
        >
          <BroadcastIcon className="w-4 h-4 inline mr-1" />
          Studio
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form action={updateLiveSession.bind(null, liveSessionId)} className="contents">
          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-7">
            <h3 className="text-white text-base font-bold mb-5">Información Básica</h3>

            <div className="mb-5">
              <label htmlFor="title" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={session.title}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="store_id" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
                Tienda
              </label>
              <select
                id="store_id"
                name="store_id"
                defaultValue={session.store_id || ""}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="">Tienda principal</option>
                {(stores ?? []).map((store: any) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="status" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={session.status}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="not_started">No iniciada</option>
                <option value="live">En vivo</option>
                <option value="paused">Pausada</option>
                <option value="ended">Finalizada</option>
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="notes" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={session.notes || ""}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors resize-y"
                placeholder="Notas internas..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/12">
              <Button type="submit" variant="primary" size="sm">
                Guardar cambios
              </Button>
              <Link
                href="/admin/lives"
                className="px-5 py-2.5 rounded-lg bg-[#2A2D35] text-[#ABB2BF] text-xs font-semibold hover:bg-white/10 transition-colors no-underline"
                prefetch={false}
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>

        <div className="bg-secondary-light border border-white/12 rounded-[16px] p-7">
          <h3 className="text-white text-base font-bold mb-5">Productos de la Sesión</h3>

          <form action={addProductToLiveSession.bind(null, liveSessionId)} className="mb-5">
            <p className="text-[#ABB2BF] text-xs mb-3">Agregar producto a la sesión</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[11px] text-[#ABB2BF]">Producto</label>
                <select
                  name="product_id"
                  required
                  className="px-3 py-2 rounded-lg bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">Seleccionar producto</option>
                  {(products ?? []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Bs. {(p.discount_price ?? p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#ABB2BF]">Orden</label>
                <input
                  type="number"
                  name="order"
                  min={0}
                  defaultValue={0}
                  className="px-3 py-2 rounded-lg bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors w-24"
                />
              </div>
              <Button type="submit" variant="primary" size="sm">
                Agregar
              </Button>
            </div>
          </form>

          {session.live_session_products && session.live_session_products.length > 0 ? (
            <div className="space-y-3">
              {session.live_session_products
                .sort((a: any, b: any) => a.order - b.order)
                .map((lp: any) => {
                  const product = lp.products
                  const images = product?.product_images ?? []
                  const mainImage = images.find((img: any) => img.is_main) ?? images[0]
                  const price = product?.discount_price ?? product?.price

                  return (
                    <div
                      key={lp.product_id}
                      className="flex items-center gap-4 p-4 bg-[#2A2D35] rounded-xl border border-white/12"
                    >
                      {mainImage && (
                        <img
                          src={mainImage.image}
                          alt={product?.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{product?.name}</div>
                        <div className="text-primary text-sm font-semibold">Bs. {price?.toFixed(2)}</div>
                        <div className="text-[#ABB2BF] text-[12px] mt-1">Orden: {lp.order}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <form action={setCurrentLiveProduct.bind(null, liveSessionId, lp.product_id)}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors border-none cursor-pointer"
                          >
                            Actual
                          </button>
                        </form>
                        <form action={removeProductFromLiveSession.bind(null, liveSessionId, lp.product_id)}>
                          <DeleteButton
                            action={removeProductFromLiveSession.bind(null, liveSessionId, lp.product_id)}
                            label="Quitar"
                            confirmMessage="¿Quitar este producto de la sesión?"
                          />
                        </form>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-10 text-[#9CA3B8]">
              <BroadcastIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay productos en esta sesión</p>
              <p className="text-xs mt-1">Agrega productos arriba para incluirlos en el live</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/12">
            <form action={deleteLiveSession.bind(null, liveSessionId)}>
              <DeleteButton
                action={deleteLiveSession.bind(null, liveSessionId)}
                label="Eliminar sesión"
                confirmMessage="¿Eliminar esta sesión en vivo permanentemente?"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}