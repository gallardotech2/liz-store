"use client"

import { useRef } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ImageDropzone } from "./ImageDropzone"

interface CategoryFormProps {
  initialData?: {
    id: number
    name: string
    slug: string
    description: string
    image: string | null
    order: number
    is_active: boolean
  }
  action: (formData: FormData) => Promise<void>
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  )
}

export function CategoryForm({ initialData, action }: CategoryFormProps) {
  const removeImageRef = useRef<HTMLInputElement>(null)

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-[13px] text-[#ABB2BF] font-medium">
          Nombre *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialData?.name ?? ""}
          className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-[13px] text-[#ABB2BF] font-medium">
          Slug *
        </label>
        <input
          id="slug"
          name="slug"
          required
          defaultValue={initialData?.slug ?? ""}
          className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label className="text-[13px] text-[#ABB2BF] font-medium">
          Imagen de la categoría
        </label>
        <input ref={removeImageRef} type="hidden" name="remove_image" defaultValue={initialData?.image ? "0" : "1"} />
        <ImageDropzone
          name="image"
          currentImage={initialData?.image}
          onClear={() => {
            if (removeImageRef.current) removeImageRef.current.value = "1"
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="order" className="text-[13px] text-[#ABB2BF] font-medium">
          Orden
        </label>
        <input
          id="order"
          name="order"
          type="number"
          defaultValue={initialData?.order ?? 0}
          className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="md:col-span-2 flex flex-col gap-1.5">
        <label htmlFor="description" className="text-[13px] text-[#ABB2BF] font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialData?.description ?? ""}
          className="px-3.5 py-2.5 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors resize-y"
        />
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-2.5 text-sm text-[#ABB2BF] cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initialData?.is_active ?? true}
            className="w-4 h-4 rounded border-white/12 bg-[#2A2D35] accent-primary"
          />
          Activo
        </label>
      </div>

      <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t border-white/12 mt-4">
        <SubmitBtn />
        <Link
          href="/admin/categories"
          className="text-sm text-[#ABB2BF] hover:text-white no-underline transition-colors"
          prefetch={false}
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
