export interface CompressResult {
  file: File
  compressed: boolean
}

export function imageIsCompressible(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
}

export async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.82,
): Promise<CompressResult> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return { file, compressed: false }
    }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    )
    if (!blob || blob.size === 0) return { file, compressed: false }

    const out = new File([blob], "producto.jpg", { type: "image/jpeg" })
    return { file: out, compressed: out.size < file.size }
  } catch {
    return { file, compressed: false }
  }
}

export function setFileInput(input: HTMLInputElement, file: File): void {
  const dt = new DataTransfer()
  dt.items.add(file)
  input.files = dt.files
}