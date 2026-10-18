export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif"

export const IMAGE_MIME_TYPES: DetectedImageType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/x-citrix-png": "image/png",
  "image/x-pngg": "image/png",
}

export const EXT_BY_MIME: Record<DetectedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function normalizeMime(type: string): string {
  const t = type.toLowerCase().trim()
  return MIME_ALIASES[t] ?? t
}

export function sniffImageType(bytes: Uint8Array): DetectedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png"
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif"
  }
  return null
}

export function isHeicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  if (!(bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)) return false
  const tag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase()
  return (
    tag.startsWith("heic") ||
    tag.startsWith("heix") ||
    tag.startsWith("hevc") ||
    tag.startsWith("hevx") ||
    tag.startsWith("mif1") ||
    tag.startsWith("msf1")
  )
}

export interface ResolvedImageType {
  type: DetectedImageType | null
  heic: boolean
}

export async function resolveImageType(file: File): Promise<ResolvedImageType> {
  const normalized = normalizeMime(file.type)
  const declared = (IMAGE_MIME_TYPES as string[]).includes(normalized)
    ? (normalized as DetectedImageType)
    : null

  let head: Uint8Array | null = null
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  } catch {
    head = null
  }

  if (!head || head.length === 0) return { type: declared, heic: false }

  const sniffed = sniffImageType(head)
  if (sniffed) return { type: sniffed, heic: false }
  if (isHeicBytes(head)) return { type: null, heic: true }
  return { type: null, heic: false }
}
