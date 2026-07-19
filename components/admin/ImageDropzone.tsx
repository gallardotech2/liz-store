"use client"

import { useRef, useState, type DragEvent } from "react"

interface ImageDropzoneProps {
  name: string
  currentImage?: string | null
  onClear?: () => void
  maxSizeMB?: number
}

export function ImageDropzone({ name, currentImage, onClear, maxSizeMB = 5 }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFile, setHasFile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const maxSize = maxSizeMB * 1024 * 1024
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

  function validate(file: File): boolean {
    setError(null)
    if (file.size > maxSize) {
      setError(`La imagen no debe superar los ${maxSizeMB}MB`)
      return false
    }
    if (!allowedTypes.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WEBP")
      return false
    }
    return true
  }

  function handleFile(file: File) {
    if (!validate(file)) return
    setPreview(URL.createObjectURL(file))
    setHasFile(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) {
      handleFile(f)
      const dt = new DataTransfer()
      dt.items.add(f)
      if (fileRef.current) fileRef.current.files = dt.files
    }
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
    setPreview(null)
    setHasFile(false)
    setError(null)
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
            ? "border-primary bg-primary/8 scale-[1.02]"
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
          accept="image/jpeg,image/png,image/webp"
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
            <span className="text-[11px] text-[#6B7280]">JPG, PNG o WEBP — máx. {maxSizeMB}MB</span>
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
            <span className="text-[11px] text-[#27AE60]">✓ Nueva imagen seleccionada</span>
          )}
        </div>
      )}

      {currentImage && !preview && !hasFile && (
        <p className="text-[11px] text-[#ABB2BF]">Imagen actual. Arrastra o selecciona para reemplazar.</p>
      )}
    </div>
  )
}
