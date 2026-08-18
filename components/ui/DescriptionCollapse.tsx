"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { parseInlineText } from "./DescriptionText"

interface DescriptionCollapseProps {
  text: string
  className?: string
}

export function DescriptionCollapse({
  text,
  className = "",
}: DescriptionCollapseProps) {
  const [expanded, setExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef(false)

  useLayoutEffect(() => {
    expandedRef.current = expanded
  }, [expanded])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const check = () => {
      if (expandedRef.current) return
      setHasOverflow(el.scrollHeight - el.clientHeight > 1)
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)

    let cancelled = false
    document.fonts?.ready?.then(() => {
      if (!cancelled) check()
    })

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [text])

  const clampClass = expanded ? "" : "line-clamp-3 md:line-clamp-6"

  return (
    <div>
      <div
        ref={containerRef}
        className={`whitespace-pre-line ${clampClass} ${className}`}
      >
        {parseInlineText(text)}
      </div>
      {hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 text-[13px] font-semibold text-primary hover:text-primary-dark cursor-pointer select-none"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  )
}