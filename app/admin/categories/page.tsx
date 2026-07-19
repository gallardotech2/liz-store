import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/Button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { deleteCategory } from "./actions"

export const revalidate = 0

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("*")
    .order("order")

  const raw = (categories ?? []) as Array<{
    id: number
    name: string
    slug: string
    description: string
    image: string | null
    order: number
    is_active: boolean
  }>

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Categorías</h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">
            {raw.length} categoría{raw.length !== 1 ? "s" : ""} registrada{raw.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/categories/nuevo" prefetch={false}>
          <Button variant="primary" size="sm">+ Nueva categoría</Button>
        </Link>
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/12 text-[#9CA3B8] text-[13px]">
                <th className="text-left px-5 py-3 font-medium w-[60px]">Img</th>
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">Slug</th>
                <th className="text-center px-5 py-3 font-medium">Orden</th>
                <th className="text-center px-5 py-3 font-medium">Activo</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {raw.map((cat) => (
                <tr key={cat.id} className="border-b border-white/12 hover:bg-white/4 transition-colors">
                  <td className="px-5 py-3.5">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#2A2D35] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-white font-medium">{cat.name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[#ABB2BF]">{cat.slug}</td>
                  <td className="px-5 py-3.5 text-center text-[#ABB2BF]">{cat.order}</td>
                  <td className="px-5 py-3.5 text-center">
                    {cat.is_active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] inline-block" />
                    ) : (
                      <span className="text-[#9CA3B8] text-[12px]">Inactivo</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/categories/${cat.id}/editar`}
                        className="text-[#ABB2BF] hover:text-white text-xs no-underline transition-colors"
                        prefetch={false}
                      >
                        Editar
                      </Link>
                      <form action={deleteCategory.bind(null, cat.id)}>
                        <DeleteButton
                          action={deleteCategory.bind(null, cat.id)}
                          label="Eliminar"
                          confirmMessage="¿Eliminar categoría?"
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {raw.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#9CA3B8]">
                    No hay categorías registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
