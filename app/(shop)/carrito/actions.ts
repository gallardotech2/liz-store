"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  parseCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  calculateCartTotal,
  CART_COOKIE,
  CART_MAX_AGE,
} from "@/lib/cart"
import {
  validateCheckoutData,
  calculateTotals,
  createOrder,
} from "@/lib/checkout"

export async function addToCartAction(formData: FormData) {
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string) || 1

  if (!productId) throw new Error("Falta el ID del producto")

  const supabase = await createClient()

  const { data: productRaw } = await supabase
    .from("products")
    .select("id, name, slug, price, discount_price, stock, product_images(image, is_main)")
    .eq("id", Number(productId))
    .eq("is_active", true)
    .single()

  if (!productRaw) throw new Error("Producto no encontrado")

  const product = productRaw as unknown as {
    id: number; name: string; slug: string; price: number
    discount_price: number | null; stock: number
    product_images: Array<{ image: string; is_main: boolean }>
  }
  const price = product.discount_price ?? product.price
  const images = product.product_images
  const mainImage = images?.find((img) => img.is_main) ?? images?.[0]
  const imageUrl = mainImage?.image ?? ""

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)

  const updatedCart = addToCart(
    cart,
    {
      id: product.id,
      name: product.name,
      price,
      image: imageUrl,
      slug: product.slug,
      stock: product.stock,
    },
    quantity,
  )

  cookieStore.set(CART_COOKIE, JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  })

  revalidatePath("/carrito")
  revalidatePath("/checkout")
}

export async function removeFromCartAction(formData: FormData) {
  const productId = formData.get("productId") as string
  if (!productId) throw new Error("Falta el ID del producto")

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)
  const updatedCart = removeFromCart(cart, productId)

  cookieStore.set(CART_COOKIE, JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  })

  revalidatePath("/carrito")
  revalidatePath("/checkout")
}

export async function updateQuantityAction(formData: FormData) {
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string) || 0

  if (!productId) throw new Error("Falta el ID del producto")

  const supabase = await createClient()

  const { data: productRaw } = await supabase
    .from("products")
    .select("stock")
    .eq("id", Number(productId))
    .eq("is_active", true)
    .single()

  if (!productRaw) throw new Error("Producto no encontrado")

  const product = productRaw as unknown as { stock: number }
  const safeQuantity = Math.min(quantity, product.stock)

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)
  const updatedCart = updateQuantity(cart, productId, safeQuantity)

  cookieStore.set(CART_COOKIE, JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  })

  revalidatePath("/carrito")
  revalidatePath("/checkout")
}

export async function checkoutAction(formData: FormData) {
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const deliveryMethod = formData.get("deliveryMethod") as "pickup" | "home"
  const deliveryLatitude = formData.get("deliveryLatitude") as string
  const deliveryLongitude = formData.get("deliveryLongitude") as string
  const deliveryAddressText = formData.get("deliveryAddressText") as string
  const deliveryReference = formData.get("deliveryReference") as string
  const pickupLocation = formData.get("pickupLocation") as string
  const paymentMethod = formData.get("paymentMethod") as "escudo" | "direct"
  const notes = formData.get("notes") as string

  const errors = validateCheckoutData({
    name,
    phone,
    deliveryMethod,
    deliveryLatitude,
    deliveryLongitude,
    deliveryAddressText,
    deliveryReference,
    pickupLocation,
    paymentMethod,
    notes,
  })

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors).join(". "))
  }

  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value)

  if (Object.keys(cart).length === 0) {
    throw new Error("El carrito está vacío")
  }

  const { items, subtotal } = calculateCartTotal(cart)
  const totals = calculateTotals(subtotal, deliveryMethod)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const addressText =
    deliveryMethod === "home"
      ? deliveryAddressText
      : pickupLocation || "Calle de la Paz #124, Livia"

  const { id, orderNumber } = await createOrder(supabase, {
    userId: user?.id ?? null,
    sessionKey: cookieStore.get("supabase-session")?.value ?? null,
    items: items.map((item) => ({
      productId: Number(item.id),
      productName: item.name,
      productSku: "",
      productImage: item.image,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
    totals,
    delivery: {
      name: name.trim(),
      phone,
      deliveryMethod,
      address: addressText,
      reference: deliveryReference,
    },
    deliveryLatitude: deliveryLatitude ? Number(deliveryLatitude) : null,
    deliveryLongitude: deliveryLongitude ? Number(deliveryLongitude) : null,
    deliveryAddressText: addressText,
    deliveryReference,
    paymentMethod,
    notes,
  })

  cookieStore.set(CART_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  revalidatePath("/carrito")

  redirect(`/checkout/${id}/success?order=${orderNumber}`)
}
