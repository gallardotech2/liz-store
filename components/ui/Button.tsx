"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "buy" | "outline" | "whatsapp"
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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 font-sans whitespace-nowrap no-underline cursor-pointer border-none",
        variant === "primary" &&
          "bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_15px_rgba(255,142,159,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,142,159,0.4)]",
        variant === "secondary" &&
          "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white hover:-translate-y-0.5",
        variant === "gold" &&
          "bg-gradient-to-br from-[#C9A96E] to-[#B8954E] text-white shadow-[0_4px_15px_rgba(201,169,110,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(201,169,110,0.4)]",
        variant === "buy" &&
          "bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] text-white shadow-[0_4px_15px_rgba(45,45,45,0.25)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(45,45,45,0.35)] hover:from-primary hover:to-primary-dark active:translate-y-0 active:shadow-[0_2px_8px_rgba(45,45,45,0.3)]",
        variant === "outline" &&
          "bg-transparent border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50",
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
