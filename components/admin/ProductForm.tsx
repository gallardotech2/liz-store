"use client"

import { useRef, useState, useCallback } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ImageDropzone } from "./ImageDropzone"
import { addProductImage, deleteProductImage, setMainProductImage } from "@/app/admin/products/actions"

interface CategoryOption {
  id: number
  name: string
}

interface ProductImage {
  id: number
  image: string
  alt_text: string
  is_main: boolean
  order: number
}

interface ProductFormProps {
  categories: CategoryOption[]
  initialData?: {
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
    images?: ProductImage[]
  }
  action: (formData: FormData) => Promise<void>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  )
}

function AddImageForm({ productId }: { productId: number }) {
  const { pending } = useFormStatus()
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <form
      action={addProductImage.bind(null, productId)}
      className="bg-[#2A2D35] rounded-xl p-4 border border-white/12"
      onSubmit={() => setTimeout(() => { setPreview(null); if (fileRef.current) fileRef.current.value = "" }, 100)}
    >
      <p className="text-[#ABB2BF] text-xs mb-3">Agregar nueva imagen</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[11px] text-[#ABB2BF]">Seleccionar imagen</label>
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-xs text-[#ABB2BF] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-none file:bg-primary file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-primary-dark transition-colors cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                if (f.size > 5 * 1024 * 1024) {
                  alert("La imagen no debe superar los 5MB")
                  e.target.value = ""
                  return
                }
                if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
                  alert("Formato no soportado. Usa JPG, PNG o WEBP")
                  e.target.value = ""
                  return
                }
                setPreview(URL.createObjectURL(f))
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#ABB2BF]">Texto alternativo</label>
          <input
            name="alt_text"
            placeholder="Descripción"
            className="px-3 py-2 rounded-lg bg-[#1E2028] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-[#ABB2BF] pb-1 cursor-pointer">
          <input type="checkbox" name="is_main" className="accent-primary" />
          Principal
        </label>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors border-none cursor-pointer disabled:opacity-50"
        >
          {pending ? "Subiendo..." : "Agregar"}
        </button>
      </div>
      {preview && (
        <div className="mt-3">
          <img src={preview} alt="Vista previa" className="w-20 h-20 rounded-xl object-cover border border-white/12" />
        </div>
      )}
    </form>
  )
}

function DeleteImageForm({ imageId }: { imageId: number }) {
  const { pending } = useFormStatus()
  return (
    <form action={deleteProductImage.bind(null, imageId)}>
      <button
        type="submit"
        disabled={pending}
        className="bg-red-500/70 text-white text-[10px] px-2 py-1 rounded hover:bg-red-500 transition-colors border-none cursor-pointer disabled:opacity-50"
      >
        {pending ? "..." : "Eliminar"}
      </button>
    </form>
  )
}

function SetMainForm({ imageId, productId }: { imageId: number; productId: number }) {
  const { pending } = useFormStatus()
  return (
    <form action={setMainProductImage.bind(null, imageId, productId)}>
      <button
        type="submit"
        disabled={pending}
        className="bg-white/20 text-white text-[10px] px-2 py-1 rounded hover:bg-white/30 transition-colors border-none cursor-pointer disabled:opacity-50"
      >
        {pending ? "..." : "Principal"}
      </button>
    </form>
  )
}

export function ProductForm({ categories, initialData, action }: ProductFormProps) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug)
  const nameRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)

  const handleNameChange = useCallback(() => {
    if (slugManuallyEdited) return
    const name = nameRef.current?.value ?? ""
    const slug = slugRef.current
    if (slug) {
      slug.value = slugify(name)
    }
  }, [slugManuallyEdited])

  const handleSlugChange = useCallback(() => {
    setSlugManuallyEdited(true)
  }, [])

  const mainImage = initialData?.images?.find((img) => img.is_main) ?? initialData?.images?.[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <form action={action} className="contents">
        <div className="md:col-span-2">
          <h3 className="text-white text-base font-bold mb-4">Información básica</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[13px] text-[#ABB2BF] font-medium">
            Nombre *
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            required
            defaultValue={initialData?.name ?? ""}
            onChange={handleNameChange}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-[13px] text-[#ABB2BF] font-medium">
            Slug *
          </label>
          <input
            ref={slugRef}
            id="slug"
            name="slug"
            required
            defaultValue={initialData?.slug ?? ""}
            onChange={handleSlugChange}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sku" className="text-[13px] text-[#ABB2BF] font-medium">
            SKU *
          </label>
          <input
            id="sku"
            name="sku"
            required
            defaultValue={initialData?.sku ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-[13px] text-[#ABB2BF] font-medium">
            Categoría *
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={initialData?.category_id ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          >
            <option value="" disabled>Seleccionar</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="text-[13px] text-[#ABB2BF] font-medium">
            Precio *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            required
            defaultValue={initialData?.price ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="discount_price" className="text-[13px] text-[#ABB2BF] font-medium">
            Precio descuento
          </label>
          <input
            id="discount_price"
            name="discount_price"
            type="number"
            step="0.01"
            defaultValue={initialData?.discount_price ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock" className="text-[13px] text-[#ABB2BF] font-medium">
            Stock *
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            required
            defaultValue={initialData?.stock ?? 0}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] text-[#ABB2BF] font-medium">
            Imagen del producto
          </label>
          <ImageDropzone
            name="image"
            currentImage={mainImage?.image}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="short_description" className="text-[13px] text-[#ABB2BF] font-medium">
            Descripción corta
          </label>
          <textarea
            id="short_description"
            name="short_description"
            rows={3}
            defaultValue={initialData?.short_description ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="long_description" className="text-[13px] text-[#ABB2BF] font-medium">
            Descripción larga
          </label>
          <textarea
            id="long_description"
            name="long_description"
            rows={3}
            defaultValue={initialData?.long_description ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors resize-y"
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-white text-base font-bold mb-4 mt-2">Estado</h3>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2.5 text-sm text-[#ABB2BF] cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initialData?.is_active ?? true}
              className="w-4 h-4 rounded border-white/12 bg-[#2A2D35] accent-primary"
            />
            Activo
          </label>
          <label className="flex items-center gap-2.5 text-sm text-[#ABB2BF] cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={initialData?.is_featured ?? false}
              className="w-4 h-4 rounded border-white/12 bg-[#2A2D35] accent-primary"
            />
            Destacado
          </label>
          <label className="flex items-center gap-2.5 text-sm text-[#ABB2BF] cursor-pointer">
            <input
              type="checkbox"
              name="is_new"
              defaultChecked={initialData?.is_new ?? false}
              className="w-4 h-4 rounded border-white/12 bg-[#2A2D35] accent-primary"
            />
            Nuevo
          </label>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-white text-base font-bold mb-4 mt-2">SEO</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="meta_description" className="text-[13px] text-[#ABB2BF] font-medium">
            Meta description
          </label>
          <textarea
            id="meta_description"
            name="meta_description"
            rows={2}
            defaultValue={initialData?.meta_description ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="meta_keywords" className="text-[13px] text-[#ABB2BF] font-medium">
            Meta keywords
          </label>
          <input
            id="meta_keywords"
            name="meta_keywords"
            defaultValue={initialData?.meta_keywords ?? ""}
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t border-white/12 mt-4">
          <SubmitBtn />
          <Link
            href="/admin/products"
            className="text-sm text-[#ABB2BF] hover:text-white no-underline transition-colors"
            prefetch={false}
          >
            Cancelar
          </Link>
        </div>
      </form>

      {initialData?.id && (
        <div className="md:col-span-2 mt-2">
          <h3 className="text-white text-base font-bold mb-4">Imágenes adicionales</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {(initialData.images ?? []).map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image}
                  alt={img.alt_text}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-white/12"
                />
                {img.is_main && (
                  <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    MAIN
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                  {!img.is_main && <SetMainForm imageId={img.id} productId={initialData.id} />}
                  <DeleteImageForm imageId={img.id} />
                </div>
              </div>
            ))}
          </div>
          <AddImageForm productId={initialData.id} />
        </div>
      )}
    </div>
  )
}
