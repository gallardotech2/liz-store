"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface ProductGalleryImage {
  id: number
  image: string
  alt_text: string | null
  is_main: boolean
  order: number
}

interface ProductGalleryProps {
  images: ProductGalleryImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const initialIndex = Math.max(
    0,
    images.findIndex((img) => img.is_main),
  )
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const activeImage = images[activeIndex] ?? images[0]

  useEffect(() => {
    if (!lightboxOpen) return

    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setIsClosing(true)
        return
      }

      if (event.key === "Tab") {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [lightboxOpen])

  useEffect(() => {
    if (!isClosing) return

    const timeout = window.setTimeout(() => {
      setLightboxOpen(false)
      setIsClosing(false)
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [isClosing])

  return (
    <>
      <div className="aspect-square rounded-[16px] overflow-hidden bg-[#FFFBF9] dark:bg-surface mb-3.75">
        {activeImage ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setIsClosing(false)
              setLightboxOpen(true)
            }}
            aria-label={`Ampliar imagen de ${productName}`}
            aria-haspopup="dialog"
            className="group relative block h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
          >
            <Image
              src={activeImage.image}
              alt={activeImage.alt_text || productName}
              width={600}
              height={600}
              className="w-full h-full object-cover object-center"
              priority
            />
            <span
              className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors duration-200 group-hover:bg-black/70"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
                <line x1="8" y1="11" x2="14" y2="11" />
                <line x1="11" y1="8" x2="11" y2="14" />
              </svg>
            </span>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)] text-4xl bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6] dark:to-surface">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${images.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`w-20 h-20 rounded-[8px] overflow-hidden cursor-pointer border-2 transition-colors duration-300 ${
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-primary"
              }`}
            >
              <Image
                src={img.image}
                alt={img.alt_text || productName}
                width={80}
                height={80}
                className="w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && activeImage && (
        <div
          className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm ${isClosing ? "animate-lightbox-out" : "animate-lightbox-in"} motion-reduce:animate-none`}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${productName}`}
          onClick={() => setIsClosing(true)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setIsClosing(true)
            }}
            aria-label="Cerrar imagen ampliada"
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-white/95 text-[#2D2D2D] shadow-lg transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className={`relative aspect-square w-full max-w-[min(1100px,calc(100dvh-2rem))] ${isClosing ? "animate-lightbox-zoom-out" : "animate-lightbox-zoom-in"} motion-reduce:animate-none`}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage.image}
              alt={activeImage.alt_text || productName}
              fill
              sizes="100vw"
              loading="eager"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
