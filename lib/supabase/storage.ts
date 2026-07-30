import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const BUCKET = "product-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
}

function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "jpg"
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}-${rand}.${ext}`
}

async function validateFile(file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`)
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer.slice(0, 8))

  const expectedMagic = MAGIC_BYTES[file.type]
  if (expectedMagic) {
    const isValid = expectedMagic.every((byte, i) => bytes[i] === byte)
    if (!isValid) {
      throw new Error("El contenido del archivo no coincide con el tipo declarado")
    }
  }
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<string> {
  await validateFile(file)

  const fileName = generateFileName(file.name)
  const filePath = `${folder}/${fileName}`

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    contentType: file.type,
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
