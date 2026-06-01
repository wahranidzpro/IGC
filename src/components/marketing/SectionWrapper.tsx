import { cn } from "@/lib/utils"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  dark?: boolean
  id?: string
}

export default function SectionWrapper({ children, className, dark, id }: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20 lg:py-28",
        dark ? "bg-brand-black text-white" : "bg-white text-brand-black",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

export function SectionHeader({
  title,
  subtitle,
  center = true,
}: {
  title: string
  subtitle?: string
  center?: boolean
}) {
  return (
    <div className={cn("mb-12 sm:mb-16", center && "text-center")}>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}
