import type { ReactNode } from "react"

export function parseInlineText(text: string): ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

interface DescriptionTextProps {
  text: string
  className?: string
}

export function DescriptionText({ text, className = "" }: DescriptionTextProps) {
  return (
    <div className={`whitespace-pre-line ${className}`}>
      {parseInlineText(text)}
    </div>
  )
}