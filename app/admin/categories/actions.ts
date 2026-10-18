"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { resolveSubmittedImageUrl, deleteImage } from "@/lib/supabase/storage"

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"
  const imageUrl = resolveSubmittedImageUrl(formData, false)

  const { data: category, error } = await (supabase as any)
    .from("categories")
    .insert({ name, slug, description, order, is_active })
    .select("id")

  if (error) throw new Error(error.message)

  if (imageUrl) {
    const categoryId = category?.[0]?.id
    if (categoryId) {
      await (supabase as any).from("categories").update({ image: imageUrl }).eq("id", categoryId)
    }
  }

  revalidatePath("/admin/categories")
  revalidatePath("/", "layout")
  updateTag("categories")
  redirect("/admin/categories")
}

export async function updateCategory(id: number, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"

  const updateData: Record<string, unknown> = { name, slug, description, order, is_active }

  const removeImage = formData.get("remove_image") === "1"
  const imageUrl = resolveSubmittedImageUrl(formData, false)

  if (removeImage && !imageUrl) {
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

  if (imageUrl) {
    const { data: old } = await (supabase as any)
      .from("categories")
      .select("image")
      .eq("id", id)
      .single()

    if (old?.image) {
      await deleteImage(old.image).catch(() => {})
    }

    updateData.image = imageUrl
  }

  const { error } = await (supabase as any)
    .from("categories")
    .update(updateData)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
  revalidatePath("/", "layout")
  updateTag("categories")
  redirect("/admin/categories")
}

export async function deleteCategory(id: number) {
  await requireAdmin()
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
  revalidatePath("/", "layout")
  updateTag("categories")
}
