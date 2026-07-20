import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/Button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { deleteProduct } from "./actions"

export const revalidate = 0

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: products } = await (supabase as any)
    .from("products")
    .select("id, name, slug, sku, price, discount_price, stock, is_active, is_featured, is_new, category:categories(name)")
    .order("id", { ascending: false })

  const raw = (products ?? []) as Array<{
    id: number
    name: string
    slug: string
    sku: string
    price: number
    discount_price: number | null
    stock: number
    is_active: boolean
    is_featured: boolean
    is_new: boolean
    category: { name: string } | { name: string }[]
  }>

  const productIds = raw.map((p) => p.id)
  const { data: allImages } = productIds.length > 0 ? await (supabase as any)
    .from("product_images")
    .select("product_id, image")
    .in("product_id", productIds)
    .order("is_main", { ascending: false })
    .order("id", { ascending: true }) : { data: [] }

  const imageMap = new Map<number, string>()
  for (const img of (allImages ?? []) as Array<{ product_id: number; image: string }>) {
    if (!imageMap.has(img.product_id)) {
      imageMap.set(img.product_id, img.image)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Productos</h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">
            {raw.length} producto{raw.length !== 1 ? "s" : ""} registrado{raw.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/products/nuevo" prefetch={false}>
          <Button variant="primary" size="sm">+ Nuevo producto</Button>
        </Link>
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/12 text-[#9CA3B8] text-[13px]">
                <th className="text-left px-5 py-3 font-medium w-[60px]">Img</th>
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">SKU</th>
                <th className="text-left px-5 py-3 font-medium">Categoría</th>
                <th className="text-right px-5 py-3 font-medium">Precio</th>
                <th className="text-right px-5 py-3 font-medium">Stock</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {raw.map((p) => {
                const cat = Array.isArray(p.category) ? p.category[0] : p.category
                return (
                  <tr key={p.id} className="border-b border-white/12 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      {imageMap.has(p.id) ? (
                        <img
                          src={imageMap.get(p.id)}
                          alt={p.name}
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
                      <div className="text-white font-medium">{p.name}</div>
                      <div className="text-[#9CA3B8] text-[12px]">{p.slug}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#ABB2BF]">{p.sku}</td>
                    <td className="px-5 py-3.5 text-[#ABB2BF]">{cat?.name ?? "-"}</td>
                    <td className="px-5 py-3.5 text-right text-white">
                      {p.discount_price ? (
                        <>
                          <span className="text-[#ABB2BF] line-through mr-1">Bs.{Number(p.price).toFixed(2)}</span>
                          <span className="text-primary font-semibold">Bs.{Number(p.discount_price).toFixed(2)}</span>
                        </>
                      ) : (
                        `Bs.${Number(p.price).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={p.stock > 0 ? "text-[#27AE60]" : "text-[#E74C3C]"}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.is_active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" title="Activo" />
                        )}
                        {p.is_featured && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F4B740]" title="Destacado" />
                        )}
                        {p.is_new && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#03C9D7]" title="Nuevo" />
                        )}
                        {!p.is_active && (
                          <span className="text-[#9CA3B8] text-[12px]">Inactivo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/editar`}
                          className="text-[#ABB2BF] hover:text-white text-xs no-underline transition-colors"
                          prefetch={false}
                        >
                          Editar
                        </Link>
                        <form action={deleteProduct.bind(null, p.id)}>
                          <DeleteButton
                            action={deleteProduct.bind(null, p.id)}
                            label="Eliminar"
                            confirmMessage="¿Eliminar producto?"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {raw.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#9CA3B8]">
                    No hay productos registrados
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
