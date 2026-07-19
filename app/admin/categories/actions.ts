"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { uploadImage, deleteImage } from "@/lib/supabase/storage"

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"

  const { data: category, error } = await (supabase as any)
    .from("categories")
    .insert({ name, slug, description, order, is_active })
    .select("id")

  if (error) throw new Error(error.message)

  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    const categoryId = category?.[0]?.id
    if (categoryId) {
      const imageUrl = await uploadImage(imageFile, `categories/${categoryId}`)
      await (supabase as any).from("categories").update({ image: imageUrl }).eq("id", categoryId)
    }
  }

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function updateCategory(id: number, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"

  const updateData: Record<string, unknown> = { name, slug, description, order, is_active }

  const removeImage = formData.get("remove_image") === "1"
  const imageFile = formData.get("image") as File | null

  if (removeImage && !(imageFile && imageFile.size > 0)) {
    const { data: old } = await (supabase as any)
      .from("categories")
      .select("image")
      .eq("id", id)
      .single()

    if (old?.image) {
      await deleteImage(old.image).catch(() => {})
    }
    updateData.image = null
  }

  if (imageFile && imageFile.size > 0) {
    const { data: old } = await (supabase as any)
      .from("categories")
      .select("image")
      .eq("id", id)
      .single()

    if (old?.image) {
      await deleteImage(old.image).catch(() => {})
    }

    const imageUrl = await uploadImage(imageFile, `categories/${id}`)
    updateData.image = imageUrl
  }

  const { error } = await (supabase as any)
    .from("categories")
    .update(updateData)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function deleteCategory(id: number) {
  const supabase = await createClient()

  const { data: cat } = await (supabase as any)
    .from("categories")
    .select("image")
    .eq("id", id)
    .single()

  if (cat?.image) {
    await deleteImage(cat.image).catch(() => {})
  }

  const { error } = await (supabase as any).from("categories").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
}
