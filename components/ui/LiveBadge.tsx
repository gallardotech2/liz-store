import { PUBLIC_LIVE_BADGE_LABEL } from "@/lib/live-copy"
import { cn } from "@/lib/utils"
import { TikTokIcon } from "./TikTokIcon"

export function LiveBadge({
  className,
  label = PUBLIC_LIVE_BADGE_LABEL,
  compact = false,
  variant = "solid",
}: {
  className?: string
  label?: string
  compact?: boolean
  variant?: "solid" | "soft" | "inverse"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[1px] whitespace-nowrap",
        compact ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[11px]",
        variant === "solid" && "bg-[#E74C3C] text-white",
        variant === "soft" &&
          "border border-[#E74C3C]/20 bg-[#E74C3C]/10 text-[#E74C3C]",
        variant === "inverse" && "bg-white/15 text-white backdrop-blur-sm",
        className,
      )}
    >
      <TikTokIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </span>
  )
}
