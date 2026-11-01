"use client"

import Image from "next/image"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

interface ProductGalleryModalImage {
  id: number
  image: string
  alt_text: string | null
  is_main: boolean
  order: number
}

interface ProductGalleryModalProps {
  images: ProductGalleryModalImage[]
  initialIndex: number
  productName: string
  onClose: (index: number) => void
}

export function ProductGalleryModal({
  images,
  initialIndex,
  productName,
  onClose,
}: ProductGalleryModalProps) {
  const safeInitialIndex = Math.min(
    Math.max(0, initialIndex),
    Math.max(0, images.length - 1),
  )
  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex)
  const trackRef = useRef<HTMLDivElement>(null)
  const backButtonRef = useRef<HTMLButtonElement>(null)
  const currentIndexRef = useRef(safeInitialIndex)
  const scrollRafRef = useRef<number | null>(null)

  const syncIndexFromScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const width = track.clientWidth
    if (width <= 0) return

    const index = Math.min(
      Math.max(0, Math.round(track.scrollLeft / width)),
      Math.max(0, images.length - 1),
    )

    currentIndexRef.current = index
    setCurrentIndex((previous) => (previous === index ? previous : index))
  }, [images.length])

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null
      syncIndexFromScroll()
    })
  }, [syncIndexFromScroll])

  const goToIndex = useCallback(
    (index: number) => {
      const next = Math.min(
        Math.max(0, index),
        Math.max(0, images.length - 1),
      )
      currentIndexRef.current = next
      setCurrentIndex(next)

      const track = trackRef.current
      if (!track) return

      const width = track.clientWidth
      track.scrollTo({ left: width * next, behavior: "smooth" })
    },
    [images.length],
  )

  const closeGallery = useCallback(() => {
    onClose(currentIndexRef.current)
  }, [onClose])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const width = track.clientWidth
    if (width > 0) track.scrollLeft = width * safeInitialIndex
    currentIndexRef.current = safeInitialIndex
    backButtonRef.current?.focus({ preventScroll: true })
  }, [safeInitialIndex])

  useEffect(() => {
    const body = document.body
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeGallery()
        return
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        goToIndex(currentIndexRef.current + 1)
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToIndex(currentIndexRef.current - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeGallery, goToIndex])

  useEffect(() => {
    const handleResize = () => {
      const track = trackRef.current
      if (!track) return

      const width = track.clientWidth
      track.scrollLeft = width * currentIndexRef.current
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  return (
    <div
      data-product-gallery-modal
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de imágenes de ${productName}`}
      className="fixed inset-0 z-[2000] flex flex-col bg-black/95 text-white backdrop-blur-sm"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-start p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          data-gallery-back
          ref={backButtonRef}
          type="button"
          onClick={closeGallery}
          aria-label="Volver a los detalles del producto"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>

      <div
        data-gallery-track
        ref={trackRef}
        onScroll={handleScroll}
        aria-label={`Imágenes de ${productName}`}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative h-full w-full shrink-0 snap-center"
            aria-hidden={index === currentIndex ? undefined : "true"}
          >
            <Image
              src={image.image}
              alt={image.alt_text || productName}
              fill
              sizes="100vw"
              priority={index === safeInitialIndex}
              draggable={false}
              className="object-contain object-center"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <span
            data-gallery-indicator
            aria-live="polite"
            className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold tracking-[0.3px] text-white/90"
          >
            {currentIndex + 1} de {images.length}
          </span>
        </div>
      )}
    </div>
  )
}
