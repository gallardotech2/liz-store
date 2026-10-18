import { createClient } from "@supabase/supabase-js"
import { IMAGE_BUCKET } from "./bucket"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const BUCKET = IMAGE_BUCKET

const UPLOAD_FOLDERS = new Set(["products", "categories"])
const UPLOAD_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"])

export interface UploadTicket {
  path: string
  token: string
  publicUrl: string
}

export async function createUploadTicket(folder: string, ext: string): Promise<UploadTicket> {
  if (!UPLOAD_FOLDERS.has(folder)) {
    throw new Error("Carpeta de imágenes no válida")
  }
  const safeExt = UPLOAD_EXTS.has(ext.toLowerCase()) ? ext.toLowerCase() : "jpg"
  const filePath = `${folder}/${generateFileName(safeExt)}`

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(filePath)
  if (error || !data?.token) {
    throw new Error("No se pudo preparar la subida de la imagen. Inténtalo de nuevo.")
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path ?? filePath)
  return { path: data.path ?? filePath, token: data.token, publicUrl: pub.publicUrl }
}

function generateFileName(ext: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}-${rand}.${ext}`
}

export function resolveSubmittedImageUrl(formData: FormData, required: boolean): string | null {
  const imageSelected = formData.get("image_selected") === "1"
  const raw = ((formData.get("image_url") as string | null) ?? "").trim()

  if (raw) {
    if (!extractPathFromUrl(raw)) {
      throw new Error("La imagen enviada no es válida. Vuelve a seleccionarla e inténtalo de nuevo.")
    }
    return raw
  }

  if (required || imageSelected) {
    throw new Error("La imagen no se subió correctamente. Vuelve a seleccionarla e inténtalo de nuevo.")
  }

  return null
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const path = extractPathFromUrl(imageUrl)
  if (!path) return

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) throw new Error(`Error al eliminar imagen: ${error.message}`)
}

export function extractPathFromUrl(imageUrl: string): string | null {
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${BUCKET}/`
  if (!imageUrl.startsWith(bucketUrl)) return null
  return imageUrl.slice(bucketUrl.length)
}
