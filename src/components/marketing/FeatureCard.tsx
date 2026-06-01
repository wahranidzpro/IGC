import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  image?: string
  href?: string
  icon?: React.ReactNode
  items?: string[]
}

export default function FeatureCard({
  title,
  description,
  image,
  href,
  icon,
  items,
}: FeatureCardProps) {
  const content = (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-brand-red before:via-brand-accent before:to-brand-red before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
      {image && (
        <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      )}
      <div className="p-6">
        {icon && <div className="mb-3 text-brand-red">{icon}</div>}
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        {items && (
          <ul className="mt-3 space-y-1.5">
            {items.map((item) => (
              <li key={item} className="text-sm text-gray-500 flex items-start gap-2">
                <span className="text-brand-red mt-1 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        )}
        {href && (
          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-red group-hover:gap-2 transition-all">
            En savoir plus <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
