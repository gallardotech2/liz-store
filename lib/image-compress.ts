export interface CompressResult {
  file: File
  compressed: boolean
}

const TARGET_BYTES = 600 * 1024
const DEFAULT_MAX_SIDE = 1600
const DEFAULT_QUALITY = 0.82
const TIMEOUT_MS = 12_000

const ATTEMPTS: Array<{ maxSide: number; quality: number }> = [
  { maxSide: 1600, quality: 0.82 },
  { maxSide: 1400, quality: 0.8 },
  { maxSide: 1280, quality: 0.78 },
  { maxSide: 1024, quality: 0.75 },
  { maxSide: 800, quality: 0.72 },
]

interface Drawable {
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tiempo de espera agotado")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error("Tiempo de espera agotado"))
    }, TIMEOUT_MS)

    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo decodificar la imagen"))
    }
    img.decoding = "async"
    img.src = url
  })
}

async function loadDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await withTimeout(
        createImageBitmap(file, { imageOrientation: "from-image" }),
        TIMEOUT_MS,
      )
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    } catch {
      try {
        const bitmap = await withTimeout(createImageBitmap(file), TIMEOUT_MS)
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        }
      } catch {
        // La imagen se intenta con HTMLImageElement más abajo.
      }
    }
  }

  const img = await loadImageElement(file)
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(img.src),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return withTimeout(
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality)
    }),
    TIMEOUT_MS,
  )
}

export function imageIsCompressible(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
}

function outputTypeFor(file: File): "image/jpeg" | "image/webp" {
  return file.type === "image/png" || file.type === "image/webp"
    ? "image/webp"
    : "image/jpeg"
}

function extensionFor(type: string): string {
  if (type === "image/webp") return "webp"
  if (type === "image/png") return "png"
  return "jpg"
}

export async function compressImage(
  file: File,
  maxSide = DEFAULT_MAX_SIDE,
  quality = DEFAULT_QUALITY,
): Promise<CompressResult> {
  if (!imageIsCompressible(file)) return { file, compressed: false }

  let drawable: Drawable
  try {
    drawable = await loadDrawable(file)
  } catch {
    return { file, compressed: false }
  }

  try {
    const originalMaxSide = Math.max(drawable.width, drawable.height)
    const targetQuality = Math.min(0.9, Math.max(0.6, quality))
    const limitSide = Math.max(1, maxSide)
    const outputType = outputTypeFor(file)

    if (originalMaxSide <= limitSide && file.size <= TARGET_BYTES) {
      return { file, compressed: false }
    }

    let best: { file: File; size: number } | null = null

    for (const attempt of ATTEMPTS) {
      const effectiveMaxSide = Math.min(attempt.maxSide, limitSide)
      const effectiveQuality = Math.min(attempt.quality, targetQuality)
      const scale = Math.min(1, effectiveMaxSide / originalMaxSide)
      const width = Math.max(1, Math.round(drawable.width * scale))
      const height = Math.max(1, Math.round(drawable.height * scale))

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) continue

      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(drawable.source, 0, 0, width, height)

      const blob = await canvasToBlob(canvas, outputType, effectiveQuality)
      if (!blob || blob.size === 0) continue

      const actualType = blob.type || outputType
      const out = new File([blob], `producto.${extensionFor(actualType)}`, {
        type: actualType,
        lastModified: file.lastModified,
      })

      if (!best || out.size < best.size) {
        best = { file: out, size: out.size }
      }
      if (best && best.size <= TARGET_BYTES) break
    }

    if (!best) return { file, compressed: false }
    if (best.size >= file.size && originalMaxSide <= limitSide) {
      return { file, compressed: false }
    }
    return { file: best.file, compressed: true }
  } catch {
    return { file, compressed: false }
  } finally {
    drawable.cleanup()
  }
}

export function setFileInput(input: HTMLInputElement, file: File): boolean {
  try {
    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    const current = input.files?.[0]
    return !!current && current.size === file.size && current.type === file.type
  } catch {
    return false
  }
}
