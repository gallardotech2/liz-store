"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ScrollNudgeProps {
  children: React.ReactNode
  className?: string
}

export function ScrollNudge({ children, className }: ScrollNudgeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const played = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const clearNudge = () => {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      animationRef.current?.cancel()
      animationRef.current = null
    }

    const runNudge = () => {
      animationRef.current = el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-28px)" },
        ],
        { duration: 600, easing: "ease-out", fill: "forwards" },
      )
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting && !played.current) {
          played.current = true
          timer = setTimeout(() => {
            timer = undefined
            runNudge()
          }, 350)
          io.disconnect()
        }
      },
      { threshold: 0.7 },
    )
    io.observe(el)

    const container = el.parentElement
    const handleScroll = () => {
      if ((container?.scrollLeft ?? 0) > 0) clearNudge()
    }
    container?.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      io.disconnect()
      clearNudge()
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div ref={ref} className={cn("flex gap-3.75", className)}>
      {children}
    </div>
  )
}
