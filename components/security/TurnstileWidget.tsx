"use client"

import { useEffect, useRef } from "react"

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
  reset: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface TurnstileWidgetProps {
  action?: string
  onToken: (token: string) => void
  resetKey?: number
  className?: string
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Turnstile")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar Turnstile"))
    document.head.appendChild(script)
  }).catch((error) => {
    scriptPromise = null
    throw error
  })

  return scriptPromise
}

export function TurnstileWidget({
  action,
  onToken,
  resetKey = 0,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current("")
      return
    }

    let cancelled = false
    onTokenRef.current("")

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "auto",
          appearance: "interaction-only",
          language: "es",
          callback: (token: string) => onTokenRef.current(token),
          "error-callback": () => onTokenRef.current(""),
          "expired-callback": () => onTokenRef.current(""),
          "timeout-callback": () => onTokenRef.current(""),
        })
      })
      .catch(() => onTokenRef.current(""))

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, action, resetKey])

  if (!siteKey) return null

  return <div ref={containerRef} className={className ?? "mt-3"} />
}
