import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { BroadcastIcon, ArrowLeftIcon } from "@/components/admin/Icons"

export const revalidate = 0

export default async function NewLiveSessionPage() {
  const supabase = await createClient()

  const { data: stores } = await (supabase as any)
    .from("store_profiles")
    .select("id, name")
    .order("name")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/lives" prefetch={false}>
            <Button variant="secondary" size="sm">
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white m-0">Nueva Sesión en Vivo <span className="text-[10px] bg-[#C9A96E] text-white px-1.5 py-0.5 rounded ml-2 font-semibold">BETA</span></h1>
        </div>
      </div>

      <form action={async (formData: FormData) => {
        "use server"
        const supabase = await createClient()
        const title = formData.get("title") as string
        const store_id = formData.get("store_id") ? Number(formData.get("store_id")) : null

        if (!title?.trim()) {
          throw new Error("El título es obligatorio")
        }

        const { data, error } = await (supabase as any)
          .from("live_sessions")
          .insert({
            title: title.trim(),
            store_id,
            status: "not_started",
            total_products_shown: 0,
            total_products_sold: 0,
            total_reserved: 0,
            total_interested: 0,
            total_likes: 0,
            total_followers: 0,
          })
          .select("id")
          .single()

        if (error) throw new Error(error.message)

        redirect(`/admin/lives/${data.id}/editar`)
      }}>
        <div className="bg-secondary-light border border-white/12 rounded-[16px] p-7">
          <div className="mb-6">
            <label htmlFor="title" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
              Título de la sesión *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="Ej: Lanzamiento colección primavera"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="store_id" className="block text-[13px] text-[#ABB2BF] font-medium mb-1.5">
              Tienda
            </label>
            <select
              id="store_id"
              name="store_id"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="">Tienda principal (Liz Store)</option>
              {(stores ?? []).map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/12">
            <Button type="submit" variant="primary" size="sm">
              <BroadcastIcon className="w-4 h-4" />
              Crear sesión
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
    </div>
  )
}