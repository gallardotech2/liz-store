"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { uploadImage, deleteImage } from "@/lib/supabase/storage"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

type DbClient = SupabaseClient
type ProductImageRow = Pick<
  Database["public"]["Tables"]["product_images"]["Row"],
  "id" | "image" | "is_main"
>

function abbreviateName(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)

  let prefix: string
  if (words.length === 0) prefix = "SKU"
  else if (words.length === 1) prefix = words[0].slice(0, 4)
  else prefix = words.slice(0, 3).map((w) => w[0]).join("")
  return prefix.toUpperCase()
}

function generateSku(name: string): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${abbreviateName(name)}-${digits}`
}

async function generateUniqueSku(supabase: DbClient, name: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateSku(name)
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("sku", candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  return generateSku(name)
}

async function resolveSku(supabase: DbClient, rawSku: string | null, name: string): Promise<string> {
  const trimmed = (rawSku ?? "").trim()
  return trimmed || (await generateUniqueSku(supabase, name))
}

function getImageFile(formData: FormData): File | null {
  const value = formData.get("image")
  if (!value || typeof value === "string") return null
  const file = value as File
  return file.size > 0 ? file : null
}

function assertImageSelection(formData: FormData, file: File | null, required = false): void {
  const selected = formData.get("image_selected") === "1"
  if ((selected || required) && !file) {
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

async function findProductImage(
  supabase: DbClient,
  productId: number,
): Promise<ProductImageRow | null> {
  const { data: main, error: mainError } = await supabase
    .from("product_images")
    .select("id, image, is_main")
    .eq("product_id", productId)
    .eq("is_main", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (mainError) throw new Error(mainError.message)
  if (main) return main

  const { data: first, error: firstError } = await supabase
    .from("product_images")
    .select("id, image, is_main")
    .eq("product_id", productId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstError) throw new Error(firstError.message)
  return first ?? null
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const sku = await resolveSku(supabase, formData.get("sku") as string | null, name)
  const category_id = Number(formData.get("category_id"))
  const price = Number(formData.get("price"))
  const discount_price = formData.get("discount_price")
    ? Number(formData.get("discount_price"))
    : null
  const stock = Number(formData.get("stock"))
  const short_description = (formData.get("short_description") as string) || ""
  const long_description = (formData.get("long_description") as string) || ""
  const is_active = formData.get("is_active") === "on"
  const is_featured = formData.get("is_featured") === "on"
  const is_new = formData.get("is_new") === "on"
  const is_offer = formData.get("is_offer") === "on"
  const meta_description = (formData.get("meta_description") as string) || ""
  const meta_keywords = (formData.get("meta_keywords") as string) || ""
  const imageFile = getImageFile(formData)

  assertImageSelection(formData, imageFile)

  const uploadedUrl = imageFile ? await uploadImage(imageFile, "products/pending") : null
  let productId: number | null = null

  try {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        sku,
        category_id,
        price,
        discount_price,
        stock,
        short_description,
        long_description,
        is_active,
        is_featured,
        is_new,
        is_offer,
        meta_description,
        meta_keywords,
      })
      .select("id")

    if (error) throw new Error(error.message)

    productId = product?.[0]?.id ?? null
    if (!productId) throw new Error("No se pudo obtener el identificador del producto creado.")

    if (uploadedUrl) {
      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: productId,
        image: uploadedUrl,
        alt_text: name,
        is_main: true,
        order: 0,
      })

      if (imageError) {
        const { error: deleteError } = await supabase
          .from("products")
          .delete()
          .eq("id", productId)

        await removeStoredImage(uploadedUrl)

        if (deleteError) {
          throw new Error(
            `El producto ${productId} se creó, pero la imagen no se pudo asociar. Edita el producto para agregarla. Detalle: ${imageError.message}`,
          )
        }
        throw new Error(`No se pudo guardar la imagen: ${imageError.message}`)
      }
    }
  } catch (error) {
    if (uploadedUrl && productId === null) {
      await removeStoredImage(uploadedUrl)
    }
    throw error
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const sku = await resolveSku(supabase, formData.get("sku") as string | null, name)
  const category_id = Number(formData.get("category_id"))
  const price = Number(formData.get("price"))
  const discount_price = formData.get("discount_price")
    ? Number(formData.get("discount_price"))
    : null
  const stock = Number(formData.get("stock"))
  const short_description = (formData.get("short_description") as string) || ""
  const long_description = (formData.get("long_description") as string) || ""
  const is_active = formData.get("is_active") === "on"
  const is_featured = formData.get("is_featured") === "on"
  const is_new = formData.get("is_new") === "on"
  const is_offer = formData.get("is_offer") === "on"
  const meta_description = (formData.get("meta_description") as string) || ""
  const meta_keywords = (formData.get("meta_keywords") as string) || ""
  const imageFile = getImageFile(formData)

  assertImageSelection(formData, imageFile)

  const updateData: Database["public"]["Tables"]["products"]["Update"] = {
    name, slug, sku, category_id, price, discount_price, stock,
    short_description, long_description, is_active, is_featured, is_new, is_offer,
    meta_description, meta_keywords,
  }

  const uploadedUrl = imageFile ? await uploadImage(imageFile, `products/${id}`) : null
  let oldImage: string | null = null

  try {
    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)

    if (error) throw new Error(error.message)

    if (uploadedUrl) {
      const existing = await findProductImage(supabase, id)
      if (existing) {
        const { error: imageError } = await supabase
          .from("product_images")
          .update({ image: uploadedUrl, alt_text: name, is_main: true })
          .eq("id", existing.id)

        if (imageError) throw new Error(imageError.message)
        oldImage = existing.image
      } else {
        const { error: imageError } = await supabase.from("product_images").insert({
          product_id: id,
          image: uploadedUrl,
          alt_text: name,
          is_main: true,
          order: 0,
        })

        if (imageError) throw new Error(imageError.message)
      }
    }
  } catch (error) {
    if (uploadedUrl) await removeStoredImage(uploadedUrl)
    throw error
  }

  if (oldImage) await removeStoredImage(oldImage)

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function deleteProduct(id: number) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("image")
    .eq("product_id", id)

  if (imagesError) throw new Error(imagesError.message)

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) throw new Error(error.message)

  for (const img of images ?? []) {
    await removeStoredImage(img.image)
  }

  revalidatePath("/admin/products")
}

export async function addProductImage(productId: number, formData: FormData) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const imageFile = getImageFile(formData)
  const alt_text = (formData.get("alt_text") as string) || ""
  const is_main = formData.get("is_main") === "on"

  assertImageSelection(formData, imageFile, true)

  const uploadedUrl = await uploadImage(imageFile!, `products/${productId}`)
  let persisted = false

  try {
    const existing = await findProductImage(supabase, productId)
    const makeMain = is_main || !existing?.is_main

    const { data: inserted, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image: uploadedUrl,
        alt_text,
        is_main: makeMain,
        order: 0,
      })
      .select("id")

    if (error) throw new Error(error.message)
    persisted = true

    const insertedId = inserted?.[0]?.id as number | undefined
    if (!insertedId) {
      throw new Error(
        "La imagen se guardó, pero no se pudo confirmar su identificador. Revisa la galería del producto.",
      )
    }

    if (makeMain) {
      const { error: clearError } = await supabase
        .from("product_images")
        .update({ is_main: false })
        .eq("product_id", productId)
        .neq("id", insertedId)

      if (clearError) {
        throw new Error(
          `La imagen se agregó como principal, pero no se pudo actualizar la imagen principal anterior: ${clearError.message}`,
        )
      }
    }
  } catch (error) {
    if (!persisted) await removeStoredImage(uploadedUrl)
    throw error
  }

  revalidatePath("/admin/products")
}

export async function deleteProductImage(id: number) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const { data: img, error: imgError } = await supabase
    .from("product_images")
    .select("id, product_id, image, is_main")
    .eq("id", id)
    .single()

  if (imgError || !img) throw new Error(imgError?.message ?? "No se encontró la imagen.")

  if (img.is_main) {
    const { data: next, error: nextError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", img.product_id)
      .neq("id", id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextError) throw new Error(nextError.message)

    if (next) {
      const { error: promoteError } = await supabase
        .from("product_images")
        .update({ is_main: true })
        .eq("id", next.id)

      if (promoteError) throw new Error(promoteError.message)
    }
  }

  const { error } = await supabase.from("product_images").delete().eq("id", id)

  if (error) throw new Error(error.message)

  await removeStoredImage(img.image)

  revalidatePath("/admin/products")
}

export async function setMainProductImage(id: number, productId: number) {
  await requireAdmin()
  const supabase = (await createClient()) as unknown as DbClient

  const { data: target, error: setError } = await supabase
    .from("product_images")
    .update({ is_main: true })
    .eq("id", id)
    .eq("product_id", productId)
    .select("id")

  if (setError) throw new Error(setError.message)
  if (!target || target.length === 0) throw new Error("No se encontró la imagen indicada.")

  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_main: false })
    .eq("product_id", productId)
    .neq("id", id)

  if (clearError) throw new Error(clearError.message)

  revalidatePath("/admin/products")
}
