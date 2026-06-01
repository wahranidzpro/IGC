import { cn } from "@/lib/utils"

interface Stat {
  value: string
  label: string
}

interface StatsBannerProps {
  stats: Stat[]
  dark?: boolean
}

export default function StatsBanner({ stats, dark }: StatsBannerProps) {
  return (
    <div
      className={cn(
        "py-12 sm:py-16 relative overflow-hidden",
        dark
          ? "bg-gradient-to-r from-brand-black via-[#1a0808] to-brand-black"
          : "bg-gradient-to-r from-gray-50 via-brand-red/5 to-gray-50"
      )}
    >
      {dark && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,6,0,0.08),transparent_60%)]" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-red">
                {stat.value}
              </div>
              <div className={cn("text-sm mt-2", dark ? "text-white/60" : "text-gray-500")}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
