"use client"

import { useState } from "react"

const DOWNLOAD_TIMEOUT_MS = 45_000

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null

  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(value)
  if (!match?.[1]) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

function fallbackFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `Liz_Store_Productos_${date}.xlsx`
}

export function ExportProductsButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeout = window.setTimeout(
      () => controller.abort(),
      DOWNLOAD_TIMEOUT_MS,
    )

    try {
      const response = await fetch("/admin/products/export", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      })

      if (
        response.redirected &&
        new URL(response.url).pathname.startsWith("/auth/login")
      ) {
        setError("Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.")
        return
      }

      const contentType = response.headers.get("content-type") ?? ""

      if (!response.ok || !contentType.includes("spreadsheetml")) {
        let message = "No se pudo descargar el Excel."

        if (contentType.includes("application/json")) {
          const payload = (await response.json().catch(() => null)) as {
            error?: unknown
          } | null
          if (typeof payload?.error === "string") {
            message = payload.error
          }
        }

        setError(message)
        return
      }

      const blob = await response.blob()
      const filename =
        filenameFromDisposition(
          response.headers.get("content-disposition"),
        ) ?? fallbackFilename()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = filename
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch (downloadError) {
      if (
        downloadError instanceof DOMException &&
        downloadError.name === "AbortError"
      ) {
        setError("La descarga tardó demasiado. Inténtalo de nuevo.")
      } else {
        setError(
          "No se pudo descargar el Excel. Revisa tu conexión e inténtalo de nuevo.",
        )
      }
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/10"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          />
        </svg>
        {loading ? "Generando Excel..." : "Descargar Excel"}
      </button>
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-[12px] text-[#E74C3C] m-0 max-w-[280px] text-right"
        >
          {error}
        </p>
      )}
    </div>
  )
}
