import { resolveImageType } from "./image-detect"

export interface CompressResult {
  file: File
  compressed: boolean
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export function imageIsCompressible(type: string | null): boolean {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp"
}

const TARGET_BYTES = 600 * 1024

const ATTEMPTS: Array<{ maxSide: number; quality: number }> = [
  { maxSide: 1600, quality: 0.85 },
  { maxSide: 1280, quality: 0.8 },
  { maxSide: 1024, quality: 0.75 },
  { maxSide: 800, quality: 0.7 },
  { maxSide: 640, quality: 0.65 },
]

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(null)
      }
    }, 10000)
    canvas.toBlob(
      (blob) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(blob)
        }
      },
      "image/jpeg",
      quality,
    )
  })
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("No se pudo decodificar la imagen"))
      img.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(
  file: File,
  options?: { forceEncode?: boolean },
): Promise<CompressResult> {
  const forceEncode = options?.forceEncode ?? false

  const resolved = await resolveImageType(file)
  const mustConvert = resolved.heic
  const canConvert = mustConvert || imageIsCompressible(resolved.type)

  if (!canConvert) return { file, compressed: false }
  if (!mustConvert && !forceEncode && file.size <= TARGET_BYTES) {
    return { file, compressed: false }
  }

  const forceAccept = forceEncode || mustConvert

  try {
    let width: number
    let height: number
    let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
    let cleanup: () => void

    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      width = bitmap.width
      height = bitmap.height
      draw = (ctx, w, h) => {
        ctx.drawImage(bitmap, 0, 0, w, h)
      }
      cleanup = () => bitmap.close()
    } catch {
      const img = await loadImageElement(file)
      width = img.naturalWidth
      height = img.naturalHeight
      draw = (ctx, w, h) => {
        ctx.drawImage(img, 0, 0, w, h)
      }
      cleanup = () => {
        img.removeAttribute("src")
      }
    }

    try {
      if (!width || !height) return { file, compressed: false }

      let best: { file: File; size: number } | null = null

      for (const attempt of ATTEMPTS) {
        const scale = Math.min(1, attempt.maxSide / Math.max(width, height))
        const w = Math.max(1, Math.round(width * scale))
        const h = Math.max(1, Math.round(height * scale))

        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) continue

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, w, h)
        draw(ctx, w, h)

        const blob = await canvasToBlob(canvas, attempt.quality)
        if (!blob || blob.size === 0) continue

        const out = new File([blob], "producto.jpg", { type: "image/jpeg" })
        if (out.size < file.size || forceAccept) {
          if (!best || out.size < best.size) best = { file: out, size: out.size }
        }
        if (best && best.size <= TARGET_BYTES) break
      }

      if (best) return { file: best.file, compressed: true }
      return { file, compressed: false }
    } finally {
      cleanup()
    }
  } catch {
    return { file, compressed: false }
  }
}

export function setFileInput(input: HTMLInputElement, file: File): boolean {
  try {
    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    return input.files != null && input.files.length === 1
  } catch {
    return false
  }
}
