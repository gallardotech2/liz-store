import { cn } from "@/lib/utils"

interface MetricCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: string
  trendDown?: boolean
  accentColor: string
}

export function MetricCard({ icon, value, label, trend, trendDown, accentColor }: MetricCardProps) {
  return (
    <div
      className="bg-secondary-light border border-white/12 rounded-[16px] p-6 transition-all duration-200 hover:border-[var(--c)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 max-sm:p-3"
      style={{ "--c": accentColor } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-4 max-sm:mb-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl max-sm:w-[34px] max-sm:h-[34px] max-sm:text-sm"
          style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-3 py-0.5 rounded-full max-sm:text-[10px] max-sm:px-2 max-sm:py-[1px]",
              trendDown ? "bg-[rgba(231,76,60,0.2)] text-white" : "bg-[rgba(39,174,96,0.2)] text-white",
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-[30px] font-extrabold text-white leading-none mb-1 max-sm:text-xl">{value}</div>
      <div className="text-sm text-[#9CA3B8] font-medium max-sm:text-[11px]">{label}</div>
    </div>
  )
}
