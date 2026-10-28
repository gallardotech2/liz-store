"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { uploadImage, deleteImage } from "@/lib/supabase/storage"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

type DbClient = SupabaseClient

function getImageFile(formData: FormData): File | null {
  const value = formData.get("image")
  if (!value || typeof value === "string") return null
  const file = value as File
  return file.size > 0 ? file : null
}

function assertImageSelection(formData: FormData, file: File | null): void {
  if (formData.get("image_selected") === "1" && !file) {
    throw new Error(
      "La imagen seleccionada no llegó al servidor. Vuelve a seleccionarla e inténtalo de nuevo.",
    )
  }
}

async function removeStoredImage(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    await deleteImage(url)
  } catch (error) {
    console.error("[images] No se pudo limpiar un archivo de Storage", { url, error })
  }
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"
  const imageFile = getImageFile(formData)

  assertImageSelection(formData, imageFile)

  const uploadedUrl = imageFile ? await uploadImage(imageFile, "categories/pending") : null

  try {
    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      description,
      order,
      is_active,
      image: uploadedUrl,
    })

    if (error) throw new Error(error.message)
  } catch (error) {
    if (uploadedUrl) await removeStoredImage(uploadedUrl)
    throw error
  }

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function updateCategory(id: number, formData: FormData) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = (formData.get("description") as string) || ""
  const order = Number(formData.get("order")) || 0
  const is_active = formData.get("is_active") === "on"
  const removeImage = formData.get("remove_image") === "1"
  const imageFile = getImageFile(formData)

  assertImageSelection(formData, imageFile)

  const { data: current, error: currentError } = await supabase
    .from("categories")
    .select("image")
    .eq("id", id)
    .single()

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "No se encontró la categoría.")
  }

  const oldImage = current.image
  const uploadedUrl = imageFile ? await uploadImage(imageFile, `categories/${id}`) : null

  const updateData: Database["public"]["Tables"]["categories"]["Update"] = {
    name,
    slug,
    description,
    order,
    is_active,
  }

  if (uploadedUrl) {
    updateData.image = uploadedUrl
  } else if (removeImage) {
    updateData.image = null
  }

  try {
    const { error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)

    if (error) throw new Error(error.message)
  } catch (error) {
    if (uploadedUrl) await removeStoredImage(uploadedUrl)
    throw error
  }

  if (uploadedUrl || removeImage) {
    await removeStoredImage(oldImage)
  }

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function deleteCategory(id: number) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const { data: cat, error: catError } = await supabase
    .from("categories")
    .select("image")
    .eq("id", id)
    .single()

  if (catError || !cat) throw new Error(catError?.message ?? "No se encontró la categoría.")

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) throw new Error(error.message)

  await removeStoredImage(cat.image)

  revalidatePath("/admin/categories")
}
