"use client"

import { useRef, useState, type DragEvent } from "react"
import { compressImage, imageIsCompressible, setFileInput, MAX_UPLOAD_BYTES } from "@/lib/image-compress"
import { resolveImageType } from "@/lib/image-detect"

interface ImageDropzoneProps {
  name: string
  currentImage?: string | null
  onClear?: () => void
  maxSizeMB?: number
  onBusyChange?: (busy: boolean) => void
  onFileStateChange?: (hasFile: boolean) => void
}

export function ImageDropzone({
  name,
  currentImage,
  onClear,
  maxSizeMB = 12,
  onBusyChange,
  onFileStateChange,
}: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFile, setHasFile] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const selectionIdRef = useRef(0)

  const maxSize = maxSizeMB * 1024 * 1024

  function updateBusy(value: boolean) {
    setIsCompressing(value)
    onBusyChange?.(value)
  }

  function updateHasFile(value: boolean) {
    setHasFile(value)
    onFileStateChange?.(value)
  }

  function resetSelection() {
    selectionIdRef.current++
    if (fileRef.current) fileRef.current.value = ""
    setPreview(null)
    updateHasFile(false)
    updateBusy(false)
  }

  async function handleFile(file: File) {
    const selectionId = ++selectionIdRef.current
    setError(null)

    try {
      if (file.size === 0) {
        setError("El archivo está vacío. Selecciona otra imagen.")
        resetSelection()
        return
      }

      if (file.size > maxSize) {
        setError(`La imagen no debe superar los ${maxSizeMB}MB`)
        resetSelection()
        return
      }

      const resolved = await resolveImageType(file)

      if (selectionId !== selectionIdRef.current) return

      if (resolved.type === null && !resolved.heic) {
        setError("Formato no soportado. Usa JPG, PNG, WEBP o GIF")
        resetSelection()
        return
      }

      let outFile = file
      if (resolved.heic || imageIsCompressible(resolved.type)) {
        updateBusy(true)
        try {
          const result = await compressImage(file, { forceEncode: resolved.heic })
          if (result.compressed) outFile = result.file
        } finally {
          if (selectionId === selectionIdRef.current) updateBusy(false)
        }
      }

      if (selectionId !== selectionIdRef.current) return

      if (resolved.heic && outFile === file) {
        setError(
          "Esta foto está en formato HEIC y el navegador no pudo convertirla. En el selector elige «Compatibilidad» o «JPG», o exporta la foto como JPG.",
        )
        resetSelection()
        return
      }

      if (outFile.size > MAX_UPLOAD_BYTES) {
        setError(
          "No se pudo comprimir esta imagen en tu dispositivo. Prueba con otra foto o redúcela en una app de edición.",
        )
        resetSelection()
        return
      }

      if (fileRef.current) {
        const injected = setFileInput(fileRef.current, outFile)
        if (!injected) {
          const current = fileRef.current.files?.[0]
          if (current && current.size > 0 && current.size <= MAX_UPLOAD_BYTES) {
            outFile = current
          } else {
            setError("Este navegador no pudo preparar la imagen para el envío. Prueba de nuevo.")
            resetSelection()
            return
          }
        }
      }

      setPreview(URL.createObjectURL(outFile))
      updateHasFile(true)
    } catch {
      if (selectionId === selectionIdRef.current) {
        setError("No se pudo procesar la imagen seleccionada.")
        resetSelection()
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    void handleFile(f)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleClear() {
    selectionIdRef.current++
    setPreview(null)
    updateHasFile(false)
    setError(null)
    updateBusy(false)
    if (fileRef.current) fileRef.current.value = ""
    onClear?.()
  }

  const showImage = preview ?? currentImage

  return (
    <div className="flex flex-col gap-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200 min-h-[120px]
          ${isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : showImage
              ? "border-white/20 bg-[#1E2028]"
              : "border-white/20 bg-[#1E2028] hover:border-white/30 hover:bg-[#22242D]"
          }
        `}
      >
        <input
          ref={fileRef}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          className="hidden"
          onChange={handleChange}
        />

        {showImage ? (
          <img
            src={showImage}
            alt="Preview"
            className="max-h-32 rounded-lg object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#9CA3B8]">
            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Arrastra una imagen o haz clic para seleccionar</span>
            <span className="text-[11px] text-[#6B7280]">JPG, PNG, WEBP o GIF — máx. {maxSizeMB}MB</span>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-primary text-sm font-semibold">Suelta la imagen aquí</span>
          </div>
        )}
      </div>

      {error && <p className="text-[#E74C3C] text-[12px]">{error}</p>}

      {showImage && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-[#E74C3C] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            {preview ? "Quitar selección" : "Eliminar imagen"}
          </button>
          {hasFile && (
            <span className="text-[11px] text-[#27AE60]">
              {isCompressing ? "Comprimiendo imagen…" : "✓ Imagen lista para guardar"}
            </span>
          )}
        </div>
      )}

      {currentImage && !preview && !hasFile && (
        <p className="text-[11px] text-[#ABB2BF]">Imagen actual. Arrastra o selecciona para reemplazar.</p>
      )}
    </div>
  )
}
