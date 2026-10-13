"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "buy" | "cart" | "outline" | "whatsapp"
  size?: "sm" | "md" | "lg"
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 font-sans whitespace-nowrap no-underline cursor-pointer border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-gradient-to-br from-primary to-primary-dark dark:from-primary/85 dark:to-primary-dark/85 dark:backdrop-blur-md dark:border dark:border-white/15 text-white shadow-[0_4px_15px_rgba(255,142,159,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,142,159,0.4)]",
        variant === "secondary" &&
          "bg-white dark:bg-white/5 dark:backdrop-blur-md dark:border-white/20 text-primary border-2 border-primary hover:bg-primary hover:text-white hover:-translate-y-0.5",
        variant === "gold" &&
          "bg-gradient-to-br from-[#C9A96E] to-[#B8954E] dark:from-[#C9A96E]/85 dark:to-[#B8954E]/85 dark:backdrop-blur-md dark:border dark:border-white/15 text-white shadow-[0_4px_15px_rgba(201,169,110,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(201,169,110,0.4)]",
        variant === "buy" &&
          "bg-gradient-to-br from-primary to-primary-dark dark:from-primary/85 dark:to-primary-dark/85 dark:backdrop-blur-md dark:border dark:border-white/15 text-white shadow-[0_4px_15px_rgba(255,142,159,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,142,159,0.4)] hover:from-primary hover:to-primary-dark active:translate-y-0 active:shadow-[0_2px_8px_rgba(255,142,159,0.3)]",
        variant === "cart" &&
          "bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] dark:from-white/10 dark:to-white/5 dark:backdrop-blur-md dark:border dark:border-white/10 text-white hover:-translate-y-0.5",
        variant === "outline" &&
          "bg-transparent dark:bg-white/5 dark:backdrop-blur-md border-2 border-gray-200 dark:border-line text-gray-400 dark:text-ink-soft hover:border-gray-300 dark:hover:border-line-strong hover:bg-gray-50 dark:hover:bg-surface-elevated",
        variant === "whatsapp" &&
          "bg-[#25D366] text-white shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:-translate-y-0.5 hover:bg-[#128C7E] hover:shadow-[0_8px_25px_rgba(18,140,126,0.4)]",
        size === "sm" && "px-5 py-2.5 text-xs",
        size === "md" && "px-8 py-3.5 text-sm",
        size === "lg" && "px-10 py-4 text-base",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
