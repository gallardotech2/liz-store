"use client"

import { useEffect, useState } from "react"
import { formatElapsed } from "@/lib/datetime"

export function LiveElapsed({
  startedAt,
  active,
  className,
  inactiveLabel = "—",
}: {
  startedAt: string | null
  active: boolean
  className?: string
  inactiveLabel?: string
}) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!active || !startedAt) return

    const update = () => setNow(Date.now())
    const initial = window.setTimeout(update, 0)
    const interval = window.setInterval(update, 1000)

    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [active, startedAt])

  if (!active || !startedAt) {
    return <span className={className}>{inactiveLabel}</span>
  }

  if (now === null) {
    return <span className={className}>00:00:00</span>
  }

  return <span className={className}>{formatElapsed(startedAt, now)}</span>
}
