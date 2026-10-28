"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface HotModeSyncProps {
  endsAt: string | null
}

export function HotModeSync({ endsAt }: HotModeSyncProps) {
  const router = useRouter()

  useEffect(() => {
    if (!endsAt) return

    const expiry = new Date(endsAt).getTime()
    const refreshIfExpired = () => {
      if (Date.now() >= expiry) router.refresh()
    }

    refreshIfExpired()

    const delay = Math.max(0, expiry - Date.now())
    const timeout = window.setTimeout(
      refreshIfExpired,
      Math.min(delay + 1000, 2_147_483_647),
    )

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfExpired()
    }

    window.addEventListener("focus", refreshIfExpired)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("focus", refreshIfExpired)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [endsAt, router])

  return null
}
