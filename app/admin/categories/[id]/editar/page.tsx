import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryForm } from "@/components/admin/CategoryForm"
import { updateCategory } from "../../actions"

export const revalidate = 0

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: category } = await (supabase as any)
    .from("categories")
    .select("*")
    .eq("id", Number(id))
    .single()

  if (!category) notFound()

  const cat = category as unknown as {
    id: number
    name: string
    slug: string
    description: string
    image: string | null
    order: number
    is_active: boolean
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Editar categoría</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">{cat.name}</p>
      </div>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6">
        <CategoryForm initialData={cat} action={updateCategory.bind(null, cat.id)} />
      </div>
    </div>
  )
}
