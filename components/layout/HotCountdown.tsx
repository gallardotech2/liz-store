"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { formatHotRemaining, getHotRemaining } from "@/lib/hot"

interface HotCountdownProps {
  endsAt: string | null
  className?: string
  expiredLabel?: string
  unlimitedLabel?: string
}

export function HotCountdown({
  endsAt,
  className,
  expiredLabel = "Finalizado",
  unlimitedLabel = "Sin límite",
}: HotCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) return

    const update = () => setRemaining(getHotRemaining(endsAt))
    const initial = window.setTimeout(update, 0)
    const interval = window.setInterval(update, 1000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [endsAt])

  if (!endsAt) {
    return <span className={className}>{unlimitedLabel}</span>
  }

  if (remaining === null) {
    return <span className={cn("tabular-nums", className)}>--:--:--</span>
  }

  if (remaining <= 0) {
    return <span className={className}>{expiredLabel}</span>
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {formatHotRemaining(remaining)}
    </span>
  )
}
