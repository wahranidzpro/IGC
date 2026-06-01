import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface HeroProps {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  height?: "full" | "large" | "medium"
  image?: string
  children?: React.ReactNode
}

export default function Hero({
  title,
  subtitle,
  cta,
  secondaryCta,
  height = "full",
  image,
  children,
}: HeroProps) {
  const heights = {
    full: "min-h-[90vh] lg:min-h-[85vh]",
    large: "min-h-[70vh] lg:min-h-[75vh]",
    medium: "min-h-[50vh] lg:min-h-[55vh]",
  }

  return (
    <section className={`relative ${heights[height]} flex items-center bg-black overflow-hidden`}>
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-brand-red/30" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 50%, rgba(225,6,0,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 30%, rgba(225,6,0,0.1) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {(cta || secondaryCta) && (
            <div className="mt-8 sm:mt-10 flex flex-wrap gap-4">
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  {cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3.5 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}
