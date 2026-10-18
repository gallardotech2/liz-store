import { createClient } from "@/lib/supabase/client"
import { IMAGE_BUCKET } from "@/lib/supabase/bucket"
import { requestImageUploadTicket } from "@/app/admin/storage-actions"
import { EXT_BY_MIME, type DetectedImageType } from "@/lib/image-detect"

export type ImageUploadFolder = "products" | "categories"

function isKnownType(type: string): type is DetectedImageType {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp" || type === "image/gif"
}

export async function uploadImageDirect(
  file: File,
  folder: ImageUploadFolder,
  contentType: string,
): Promise<string> {
  const type: DetectedImageType = isKnownType(contentType) ? contentType : "image/jpeg"
  const ext = EXT_BY_MIME[type]

  const ticket = await requestImageUploadTicket(folder, ext)

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .uploadToSignedUrl(ticket.path, ticket.token, file, {
      contentType: type,
      cacheControl: "31536000",
    })

  if (error) {
    throw new Error("No se pudo subir la imagen. Revisa tu conexión e inténtalo de nuevo.")
  }

  return ticket.publicUrl
}
