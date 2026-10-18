import { createClient } from "@supabase/supabase-js"
import { sniffImageType, normalizeMime } from "@/lib/image-detect"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const BUCKET = "product-images"
const MAX_FILE_SIZE = 12 * 1024 * 1024 // 12MB (se comprime antes de subir; safety net)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

function generateFileName(ext: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}-${rand}.${ext}`
}

// Valida por CONTENIDO (magic bytes), no por el MIME declarado: el selector de
// Android puede reportar "" o alias (image/jpg, image/x-png) con bytes válidos.
// Devuelve el tipo real del archivo.
export async function validateFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const detected = sniffImageType(head)

  if (!detected) {
    const declared = normalizeMime(file.type)
    if (declared === "image/heic" || declared === "image/heif") {
      throw new Error("Formato HEIC/HEIF no admitido. Exporta la foto como JPG o PNG e inténtalo de nuevo")
    }
    throw new Error("No se pudo reconocer el formato de la imagen. Usa JPG, PNG o WEBP")
  }

  if (detected === "image/heic" || detected === "image/heif") {
    throw new Error("Formato HEIC/HEIF no admitido. Exporta la foto como JPG o PNG e inténtalo de nuevo")
  }

  if (!ALLOWED_MIME_TYPES.includes(detected)) {
    throw new Error(`Tipo de archivo no permitido: ${detected}`)
  }

  return detected
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<string> {
  const detectedType = await validateFile(file)

  const fileName = generateFileName(EXT_BY_TYPE[detectedType] ?? "jpg")
  const filePath = `${folder}/${fileName}`

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    contentType: detectedType,
    upsert: true,
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
