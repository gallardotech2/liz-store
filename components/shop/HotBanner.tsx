import Link from "next/link"
import { HotCountdown } from "@/components/layout/HotCountdown"
import { getPublicLiveTitle, isDefaultLiveTitle } from "@/lib/live-copy"
import { cn } from "@/lib/utils"

interface HotBannerProps {
  title: string
  endsAt: string | null
  ctaHref?: string
  className?: string
}

export function HotBanner({
  title,
  endsAt,
  ctaHref = "/productos",
  className,
}: HotBannerProps) {
  if (isDefaultLiveTitle(title) && !endsAt) {
    return null
  }

  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[rgba(255,142,159,0.24)] bg-gradient-to-r from-[#FFF7F8] via-white to-[#FFF7F8] px-4 py-3 text-center dark:border-white/10 dark:from-surface dark:via-surface-elevated dark:to-surface",
        className,
      )}
    >
      {!isDefaultLiveTitle(title) && (
        <span className="text-sm font-semibold text-[#2D2D2D] dark:text-ink-strong">
          {getPublicLiveTitle(title)}
        </span>
      )}
      {endsAt && (
        <span className="text-[12px] text-[#6B6B6B] dark:text-ink-soft">
          Termina en{" "}
          <HotCountdown
            endsAt={endsAt}
            className="font-bold text-[#E74C3C]"
          />
        </span>
      )}
      <Link
        href={ctaHref}
        className="rounded-full bg-gradient-to-br from-primary to-primary-dark px-3.5 py-1.5 text-[11px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
        prefetch={false}
      >
        Ver productos
      </Link>
    </div>
  )
}
