import { createClient } from "@supabase/supabase-js"
import { sniffImageType, isHeicBytes, EXT_BY_MIME } from "@/lib/image-detect"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const BUCKET = "product-images"
const MAX_FILE_SIZE = 12 * 1024 * 1024

function generateFileName(ext: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}-${rand}.${ext}`
}

async function detectUploadType(file: File): Promise<{ type: string; ext: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const detected = sniffImageType(head)
  if (detected) {
    return { type: detected, ext: EXT_BY_MIME[detected] }
  }

  if (isHeicBytes(head)) {
    throw new Error(
      "La imagen está en formato HEIC. Exporta la foto como JPG e inténtalo de nuevo.",
    )
  }

  throw new Error("El archivo no es una imagen válida (JPG, PNG, WEBP o GIF)")
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<string> {
  const { type, ext } = await detectUploadType(file)

  const fileName = generateFileName(ext)
  const filePath = `${folder}/${fileName}`

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    contentType: type,
    upsert: true,
    cacheControl: "31536000",
  })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

  return publicUrl.publicUrl
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const path = extractPathFromUrl(imageUrl)
  if (!path) return

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) throw new Error(`Error al eliminar imagen: ${error.message}`)
}

function extractPathFromUrl(imageUrl: string): string | null {
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${BUCKET}/`
  if (!imageUrl.startsWith(bucketUrl)) return null
  return imageUrl.slice(bucketUrl.length)
}
