"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[rgba(231,76,60,0.1)] flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif text-[#2D2D2D] mb-3">
          Algo salió mal
        </h1>
        <p className="text-[#6B6B6B] text-sm mb-8 leading-relaxed">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold border-none cursor-pointer hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(255,142,159,0.3)]"
        >
          Intentar de nuevo
        </button>
      </div>
    </section>
  )
}
