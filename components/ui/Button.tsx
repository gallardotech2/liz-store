import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "outline"
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
          "bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_15px_rgba(183,110,121,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(183,110,121,0.4)]",
        variant === "secondary" &&
          "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white hover:-translate-y-0.5",
        variant === "gold" &&
          "bg-gradient-to-br from-[#C9A96E] to-[#B8954E] text-white shadow-[0_4px_15px_rgba(201,169,110,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(201,169,110,0.4)]",
        variant === "outline" &&
          "bg-transparent border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50",
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
