"use client"

import { useEffect, useLayoutEffect } from "react"
import { usePathname } from "next/navigation"

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

export function ScrollToTop() {
  const pathname = usePathname()

  useIsoLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
