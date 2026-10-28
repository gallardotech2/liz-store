"use client"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { compressImage, imageIsCompressible, setFileInput } from "@/lib/image-compress"
import {
  checkImageFile,
  fitsUploadLimit,
  IMAGE_READ_ERROR,
  UPLOAD_LIMIT_ERROR,
} from "@/lib/image-detect"

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLabel, setProcessingLabel] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef(0)
  const previewUrlRef = useRef<string | null>(null)

  const maxSize = maxSizeMB * 1024 * 1024

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  function updatePreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreview(url)
  }

  function setBusy(value: boolean) {
    setIsProcessing(value)
    onBusyChange?.(value)
  }

  function setFileState(value: boolean) {
    setHasFile(value)
    onFileStateChange?.(value)
  }

  function clearInput() {
    if (fileRef.current) fileRef.current.value = ""
  }

  function resetSelectionUi() {
    updatePreview(null)
    setFileState(false)
    clearInput()
  }

  async function handleFile(file: File) {
    const token = ++selectionRef.current
    setError(null)
    setProcessingLabel("Validando imagen…")
    setBusy(true)

    try {
      const checked = await checkImageFile(file, maxSize)
      if (token !== selectionRef.current) return
      if (!checked.ok) {
        setError(checked.error)
        resetSelectionUi()
        return
      }

      let outFile = checked.file
      if (imageIsCompressible(outFile)) {
        setProcessingLabel("Procesando imagen…")
        const result = await compressImage(outFile)
        if (token !== selectionRef.current) return
        if (result.compressed) outFile = result.file
      }

      if (!fitsUploadLimit(outFile)) {
        setError(UPLOAD_LIMIT_ERROR)
        resetSelectionUi()
        return
      }
      if (token !== selectionRef.current) return

      if (!fileRef.current || !setFileInput(fileRef.current, outFile)) {
        setError("Tu navegador no permitió preparar la imagen para el envío. Vuelve a intentarlo.")
        resetSelectionUi()
        return
      }

      const current = fileRef.current.files?.[0]
      if (!current || current.size !== outFile.size || current.type !== outFile.type) {
        setError("No se pudo verificar la imagen preparada. Vuelve a seleccionarla.")
        resetSelectionUi()
        return
      }

      updatePreview(URL.createObjectURL(outFile))
      setFileState(true)
    } catch (err) {
      if (token === selectionRef.current) {
        setError(err instanceof Error && err.message ? err.message : IMAGE_READ_ERROR)
        resetSelectionUi()
      }
    } finally {
      if (token === selectionRef.current) {
        setBusy(false)
        setProcessingLabel("")
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
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
    const wasPreview = !!preview
    selectionRef.current++
    setError(null)
    resetSelectionUi()
    setBusy(false)
    setProcessingLabel("")
    if (!wasPreview) onClear?.()
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

      {showImage && (preview || onClear) && (
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
              {isProcessing ? processingLabel : "✓ Nueva imagen seleccionada (se comprime al guardar)"}
            </span>
          )}
        </div>
      )}

      {isProcessing && !hasFile && (
        <p className="text-[#ABB2BF] text-[11px]">{processingLabel}</p>
      )}

      {currentImage && !preview && !hasFile && (
        <p className="text-[11px] text-[#ABB2BF]">Imagen actual. Arrastra o selecciona para reemplazar.</p>
      )}
    </div>
  )
}
