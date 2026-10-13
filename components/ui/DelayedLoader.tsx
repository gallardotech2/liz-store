"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface DelayedLoaderProps {
  delayMs?: number
  variant?: "overlay" | "inline"
  label?: string
  labelClassName?: string
  className?: string
}

export function DelayedLoader({
  delayMs = 500,
  variant = "overlay",
  label = "Cargando",
  labelClassName,
  className,
}: DelayedLoaderProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  if (!visible) return null

  const spinner = (
    <span
      aria-hidden="true"
      className="inline-block h-8 w-8 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin motion-reduce:animate-none"
    />
  )

  if (variant === "inline") {
    return (
      <span role="status" aria-label={label} className={cn("inline-flex", className)}>
        {spinner}
      </span>
    )
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center min-h-[45vh] py-16", className)}
    >
      <div className="flex flex-col items-center gap-3">
        {spinner}
        {label && (
          <span className={labelClassName ?? "text-[13px] font-medium text-[#6B6B6B] dark:text-ink-soft"}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}