"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { finalizeExpiredLiveMode } from "@/app/admin/lives/actions"

export function LiveExpirySync({
  sessionId,
  expired,
}: {
  sessionId: number
  expired: boolean
}) {
  const router = useRouter()
  const synced = useRef(false)

  useEffect(() => {
    if (!expired || synced.current) return
    synced.current = true

    void finalizeExpiredLiveMode(sessionId).then(() => router.refresh())
  }, [expired, router, sessionId])

  return null
}
