"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ProductGalleryModal } from "@/components/shop/ProductGalleryModal"

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

interface ZoomPanelPlacement {
  left: number
  top: number
  size: number
}

const ZOOM_SCALE = 2.5
const PANEL_EDGE = 16
const PANEL_GAP = 16
const TAP_CANCEL_PX = 10
const HOVER_ZOOM_MIN_WIDTH = 1024

function getOrigin(rect: DOMRect, clientX: number, clientY: number) {
  const x = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5
  const y = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5

  return {
    x: Math.min(1, Math.max(0, x)) * 100,
    y: Math.min(1, Math.max(0, y)) * 100,
  }
}

function getPanelPlacement(rect: DOMRect): ZoomPanelPlacement {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const size = Math.round(
    Math.max(
      180,
      Math.min(480, viewportWidth * 0.4, viewportHeight - PANEL_EDGE * 2),
    ),
  )
  const rightLeft = rect.right + PANEL_GAP
  let left: number

  if (rightLeft + size <= viewportWidth - PANEL_EDGE) {
    left = rightLeft
  } else if (rect.left - PANEL_GAP - size >= PANEL_EDGE) {
    left = rect.left - PANEL_GAP - size
  } else {
    left = (viewportWidth - size) / 2
  }

  const top = Math.min(
    Math.max(rect.top + (rect.height - size) / 2, PANEL_EDGE),
    viewportHeight - size - PANEL_EDGE,
  )

  return { left: Math.round(left), top: Math.round(top), size }
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const initialIndex = Math.max(
    0,
    images.findIndex((img) => img.is_main),
  )
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState<
    (ZoomPanelPlacement & {
      originX: number
      originY: number
    }) | null
  >(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const activeImage = images[activeIndex] ?? images[0]

  const imageBoxRef = useRef<HTMLButtonElement>(null)
  const zoomedImageRef = useRef<HTMLDivElement>(null)
  const originRef = useRef({ x: 50, y: 50 })
  const zoomActiveRef = useRef(false)
  const tapStartRef = useRef<{ x: number; y: number } | null>(null)

  const applyOrigin = useCallback(() => {
    const node = zoomedImageRef.current
    if (!node) return
    node.style.transformOrigin = `${originRef.current.x}% ${originRef.current.y}%`
  }, [])

  const openZoom = useCallback((clientX: number, clientY: number) => {
    const box = imageBoxRef.current
    if (!box) return

    const rect = box.getBoundingClientRect()
    const origin = getOrigin(rect, clientX, clientY)
    originRef.current = origin
    zoomActiveRef.current = true
    setZoom({
      ...getPanelPlacement(rect),
      originX: origin.x,
      originY: origin.y,
    })
  }, [])

  const updateZoom = useCallback(
    (clientX: number, clientY: number) => {
      const box = imageBoxRef.current
      if (!box || !zoomActiveRef.current) return

      originRef.current = getOrigin(
        box.getBoundingClientRect(),
        clientX,
        clientY,
      )
      applyOrigin()
    },
    [applyOrigin],
  )

  const closeZoom = useCallback(() => {
    zoomActiveRef.current = false
    setZoom(null)
  }, [])

  const openGallery = useCallback(() => {
    closeZoom()
    setGalleryOpen(true)
  }, [closeZoom])

  const closeGallery = useCallback(
    (index: number) => {
      setGalleryOpen(false)
      setActiveIndex(
        Math.min(
          Math.max(0, index),
          Math.max(0, images.length - 1),
        ),
      )
      window.requestAnimationFrame(() => {
        imageBoxRef.current?.focus({ preventScroll: true })
      })
    },
    [images.length],
  )

  useEffect(() => {
    if (!zoom) return

    const handleScrollOrResize = () => closeZoom()

    window.addEventListener("scroll", handleScrollOrResize, { passive: true })
    window.addEventListener("resize", handleScrollOrResize)

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [zoom, closeZoom])

  const handlePointerEnter = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") return
    if (window.innerWidth < HOVER_ZOOM_MIN_WIDTH) return
    openZoom(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") return
    if (!zoomActiveRef.current) return
    updateZoom(event.clientX, event.clientY)
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") {
      if (zoomActiveRef.current) closeZoom()
      return
    }

    tapStartRef.current = null
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") return
    tapStartRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") return

    const start = tapStartRef.current
    tapStartRef.current = null
    if (!start) return

    const distance = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    )
    if (distance <= TAP_CANCEL_PX) openGallery()
  }

  const handlePointerCancel = () => {
    tapStartRef.current = null
  }

  const handleImageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0 || window.innerWidth < HOVER_ZOOM_MIN_WIDTH) {
      openGallery()
    }
  }

  return (
    <>
      <div className="aspect-square rounded-[16px] overflow-hidden bg-[#FFFBF9] dark:bg-surface mb-3.75">
        {activeImage ? (
          <button
            ref={imageBoxRef}
            type="button"
            data-gallery-trigger
            aria-label={`Abrir galería de imágenes de ${productName}`}
            aria-haspopup="dialog"
            className="group relative block h-full w-full cursor-zoom-in select-none touch-manipulation border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            style={{ WebkitTouchCallout: "none" }}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClick={handleImageClick}
            onContextMenu={(event) => event.preventDefault()}
          >
            <Image
              src={activeImage.image}
              alt={activeImage.alt_text || productName}
              width={600}
              height={600}
              draggable={false}
              className="w-full h-full object-cover object-center"
              priority
            />
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

      {zoom &&
        activeImage &&
        createPortal(
          <div
            data-product-zoom-panel
            aria-hidden="true"
            className="pointer-events-none fixed z-[1050] overflow-hidden rounded-[16px] border border-[#eee] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] animate-zoom-panel-in motion-reduce:animate-none dark:border-line dark:bg-surface"
            style={{
              left: zoom.left,
              top: zoom.top,
              width: zoom.size,
              height: zoom.size,
            }}
          >
            <div
              ref={zoomedImageRef}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `scale(${ZOOM_SCALE})`,
                transformOrigin: `${zoom.originX}% ${zoom.originY}%`,
              }}
            >
              <Image
                src={activeImage.image}
                alt=""
                fill
                sizes="1200px"
                loading="eager"
                draggable={false}
                className="object-cover object-center"
              />
            </div>
          </div>,
          document.body,
        )}

      {galleryOpen &&
        activeImage &&
        createPortal(
          <ProductGalleryModal
            images={images}
            initialIndex={activeIndex}
            productName={productName}
            onClose={closeGallery}
          />,
          document.body,
        )}
    </>
  )
}
