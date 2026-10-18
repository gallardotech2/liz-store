export interface CompressResult {
  file: File
  compressed: boolean
}

export function imageIsCompressible(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
}

// Objetivo tras comprimir: el archivo enviado al servidor siempre queda muy por
// debajo del límite del Server Action (4MB) y ahorra almacenamiento free de Supabase.
const TARGET_BYTES = 1.5 * 1024 * 1024

const ATTEMPTS: Array<{ maxSide: number; quality: number }> = [
  { maxSide: 1600, quality: 0.85 },
  { maxSide: 1280, quality: 0.8 },
  { maxSide: 1024, quality: 0.75 },
  { maxSide: 800, quality: 0.7 },
  { maxSide: 640, quality: 0.65 },
]

export async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.82,
): Promise<CompressResult> {
  // Archivos livianos se envían tal cual (preserva PNG y transparencia).
  if (file.size <= TARGET_BYTES) return { file, compressed: false }

  try {
    const bitmap = await createImageBitmap(file)

    let best: { file: File; size: number } | null = null

    for (const attempt of ATTEMPTS) {
      const effectiveMaxSide = Math.min(attempt.maxSide, maxSide)
      const effectiveQuality = Math.min(attempt.quality, quality)
      const scale = Math.min(1, effectiveMaxSide / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) continue

      // Fondo blanco: JPEG no soporta transparencia y evitaría negro.
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", effectiveQuality),
      )
      if (!blob || blob.size === 0) continue

      const out = new File([blob], "producto.jpg", { type: "image/jpeg" })
      if (out.size < file.size && (!best || out.size < best.size)) {
        best = { file: out, size: out.size }
      }
      if (best && best.size <= TARGET_BYTES) {
        bitmap.close()
        return { file: best.file, compressed: true }
      }
    }

    bitmap.close()
    if (best) return { file: best.file, compressed: true }
    return { file, compressed: false }
  } catch {
    return { file, compressed: false }
  }
}

export function setFileInput(input: HTMLInputElement, file: File): void {
  const dt = new DataTransfer()
  dt.items.add(file)
  input.files = dt.files
}