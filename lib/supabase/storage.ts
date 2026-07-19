import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(url, serviceKey)

const BUCKET = "product-images"

function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "jpg"
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}-${rand}.${ext}`
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<string> {
  const fileName = generateFileName(file.name)
  const filePath = `${folder}/${fileName}`

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

  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) throw new Error(`Error al eliminar imagen: ${error.message}`)
}

function extractPathFromUrl(imageUrl: string): string | null {
  const bucketUrl = `${url}/storage/v1/object/public/${BUCKET}/`
  if (!imageUrl.startsWith(bucketUrl)) return null
  return imageUrl.slice(bucketUrl.length)
}
