// Detección de tipo real de imagen por magic bytes.
// El MIME que reporta el selector (File.type) es metadato del proveedor de
// archivos: en Android puede venir vacío o como alias (image/jpg, image/x-png,
// image/pjpeg) aunque los bytes sean un JPG/PNG válido (MDN Blob.type).
// Por eso el contenido manda y el MIME declarado es solo referencia.

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Límite de subida por debajo de experimental.serverActions.bodySizeLimit ("4mb"
// en next.config.ts), dejando margen para el overhead de multipart/form-data
// (10–20KB según la documentación de Next.js).
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024

export const HEIC_ERROR =
  "Formato HEIC/HEIF no compatible con la web. Exporta la foto como JPG o PNG desde tu galería (Compartir → Exportar/Guardar como) y vuelve a intentarlo."

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-pjpeg": "image/jpeg",
  "image/x-jpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/x-citrix-jpeg": "image/jpeg",
  "image/x-citrix-png": "image/png",
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function normalizeMime(type: string | null | undefined): string {
  const t = (type ?? "").toLowerCase().trim()
  return MIME_ALIASES[t] ?? t
}

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  return signature.every((b, i) => bytes[offset + i] === b)
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "heif"]

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return ""
  let out = ""
  for (let i = 0; i < length; i++) out += String.fromCharCode(bytes[offset + i])
  return out
}

function isHeicContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12 || ascii(bytes, 4, 4) !== "ftyp") return false
  const brands = [ascii(bytes, 8, 4)]
  for (let off = 16; off + 4 <= bytes.length && off < 32; off += 4) {
    brands.push(ascii(bytes, off, 4))
  }
  return brands.some((b) => HEIC_BRANDS.includes(b))
}

// Devuelve el MIME real según los primeros bytes, o null si no se reconoce.
export function sniffImageType(bytes: Uint8Array): string | null {
  if (matches(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (matches(bytes, PNG_SIGNATURE)) return "image/png"
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "image/webp"
  }
  if (ascii(bytes, 0, 4) === "GIF8") return "image/gif"
  if (matches(bytes, [0x42, 0x4d])) return "image/bmp"
  if (matches(bytes, [0x49, 0x49, 0x2a, 0x00]) || matches(bytes, [0x4d, 0x4d, 0x00, 0x2a])) {
    return "image/tiff"
  }
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4)
    if (brand === "avif" || brand === "avis") return "image/avif"
    if (isHeicContainer(bytes)) return "image/heic"
  }
  return null
}

export interface ResolvedImage {
  type: string
  ext: string
  sniffed: string | null
  supported: boolean
  heic: boolean
}

export async function resolveImageType(file: File): Promise<ResolvedImage> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const sniffed = sniffImageType(head)
  const type = sniffed ?? normalizeMime(file.type)
  const heic = type === "image/heic" || type === "image/heif"
  return {
    type,
    ext: EXT_BY_TYPE[type] ?? file.name.split(".").pop()?.toLowerCase() ?? "jpg",
    sniffed,
    supported: SUPPORTED_IMAGE_TYPES.includes(type),
    heic,
  }
}

export type ImageCheck =
  | { ok: true; file: File; type: string }
  | { ok: false; error: string }

// Puerta de validación del cliente: tamaño, formato real por contenido y
// re-envolver del File con el MIME canónico para que todo lo downstream
// (compresión, Server Action, storage) trabaje con el tipo correcto.
export async function checkImageFile(file: File, maxBytes: number): Promise<ImageCheck> {
  if (file.size === 0) {
    return { ok: false, error: "El archivo está vacío. Vuelve a seleccionar la imagen." }
  }
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `La imagen no debe superar los ${Math.round(maxBytes / 1024 / 1024)}MB`,
    }
  }

  const resolved = await resolveImageType(file)

  if (resolved.heic) return { ok: false, error: HEIC_ERROR }
  if (!resolved.sniffed || !resolved.supported) {
    return { ok: false, error: "Formato no soportado. Usa JPG, PNG o WEBP" }
  }

  const out = file.type === resolved.type ? file : new File([file], file.name, { type: resolved.type })
  return { ok: true, file: out, type: resolved.type }
}

// El Server Action de Next.js rechaza el body completo si supera bodySizeLimit;
// conviene rechazar en el cliente con un mensaje claro antes de enviar.
export function fitsUploadLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_BYTES
}

export const UPLOAD_LIMIT_ERROR =
  "La imagen supera el límite de subida del servidor (3.5MB) incluso después de comprimirla. Prueba con otra foto o con una captura más pequeña."
