"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { uploadImage, deleteImage } from "@/lib/supabase/storage"

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const sku = formData.get("sku") as string
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
  const meta_description = (formData.get("meta_description") as string) || ""
  const meta_keywords = (formData.get("meta_keywords") as string) || ""

  const { data: product, error } = await (supabase as any)
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
      meta_description,
      meta_keywords,
    })
    .select("id")

  if (error) throw new Error(error.message)

  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    const productId = product?.[0]?.id
    if (productId) {
      const imageUrl = await uploadImage(imageFile, `products/${productId}`)
      await (supabase as any).from("product_images").insert({
        product_id: productId,
        image: imageUrl,
        alt_text: name,
        is_main: true,
        order: 0,
      })
    }
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(id: number, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const sku = formData.get("sku") as string
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
  const meta_description = (formData.get("meta_description") as string) || ""
  const meta_keywords = (formData.get("meta_keywords") as string) || ""

  const updateData: Record<string, unknown> = {
    name, slug, sku, category_id, price, discount_price, stock,
    short_description, long_description, is_active, is_featured, is_new,
    meta_description, meta_keywords,
  }

  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    const { data: existing } = await (supabase as any)
      .from("product_images")
      .select("id, image")
      .eq("product_id", id)
      .eq("is_main", true)
      .maybeSingle()

    if (existing?.image) {
      await deleteImage(existing.image).catch(() => {})
      await (supabase as any).from("product_images").delete().eq("id", existing.id)
    } else {
      const { data: firstImg } = await (supabase as any)
        .from("product_images")
        .select("id, image")
        .eq("product_id", id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstImg?.image) {
        await deleteImage(firstImg.image).catch(() => {})
        await (supabase as any).from("product_images").delete().eq("id", firstImg.id)
      }
    }

    const imageUrl = await uploadImage(imageFile, `products/${id}`)
    await (supabase as any).from("product_images").insert({
      product_id: id,
      image: imageUrl,
      alt_text: name,
      is_main: true,
      order: 0,
    })
  }

  const { error } = await (supabase as any)
    .from("products")
    .update(updateData)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function deleteProduct(id: number) {
  const supabase = await createClient()

  const { data: images } = await (supabase as any)
    .from("product_images")
    .select("image")
    .eq("product_id", id)

  for (const img of images ?? []) {
    await deleteImage(img.image).catch(() => {})
  }

  const { error } = await (supabase as any).from("products").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
}

export async function addProductImage(productId: number, formData: FormData) {
  const supabase = await createClient()

  const imageFile = formData.get("image") as File | null
  const alt_text = (formData.get("alt_text") as string) || ""
  const is_main = formData.get("is_main") === "on"

  if (!imageFile || imageFile.size === 0) throw new Error("Selecciona una imagen")

  const imageUrl = await uploadImage(imageFile, `products/${productId}`)

  if (is_main) {
    await (supabase as any)
      .from("product_images")
      .update({ is_main: false })
      .eq("product_id", productId)
  }

  const { error } = await (supabase as any).from("product_images").insert({
    product_id: productId,
    image: imageUrl,
    alt_text,
    is_main,
    order: 0,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
}

export async function deleteProductImage(id: number) {
  const supabase = await createClient()

  const { data: img } = await (supabase as any)
    .from("product_images")
    .select("image")
    .eq("id", id)
    .single()

  if (img?.image) {
    await deleteImage(img.image).catch(() => {})
  }

  const { error } = await (supabase as any).from("product_images").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
}

export async function setMainProductImage(id: number, productId: number) {
  const supabase = await createClient()
  const s = supabase as any

  const { error: clearError } = await s
    .from("product_images")
    .update({ is_main: false })
    .eq("product_id", productId)

  if (clearError) throw new Error(clearError.message)

  const { error } = await s
    .from("product_images")
    .update({ is_main: true })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
}
