import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/ProductForm"
import { updateProduct } from "../../actions"

export const revalidate = 0

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const s = supabase as any

  const [productResult, categoriesResult, imagesResult] = await Promise.all([
    s.from("products").select("*").eq("id", Number(id)).single(),
    s.from("categories").select("id, name").eq("is_active", true).order("name"),
    s.from("product_images").select("*").eq("product_id", Number(id)).order("order"),
  ])

  if (!productResult.data) notFound()

  const p = productResult.data as unknown as {
    id: number
    name: string
    slug: string
    sku: string
    category_id: number
    price: number
    discount_price: number | null
    stock: number
    short_description: string
    long_description: string
    is_active: boolean
    is_featured: boolean
    is_new: boolean
    meta_description: string
    meta_keywords: string
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Editar producto</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">{p.name}</p>
      </div>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6">
        <ProductForm
          categories={categoriesResult.data ?? []}
          initialData={{ ...p, images: imagesResult.data ?? [] }}
          action={updateProduct.bind(null, p.id)}
        />
      </div>
    </div>
  )
}
