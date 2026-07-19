import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/ProductForm"
import { createProduct } from "../actions"

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Nuevo producto</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">Completa los campos para agregar un producto</p>
      </div>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6">
        <ProductForm categories={categories ?? []} action={createProduct} />
      </div>
    </div>
  )
}
