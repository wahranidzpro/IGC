import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  highlighted?: boolean
  cta?: { label: string; href: string }
}

export default function PricingCard({
  name,
  price,
  period = "/ mois",
  description,
  features,
  highlighted,
  cta,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-8 flex flex-col",
        highlighted
          ? "bg-brand-red text-white ring-4 ring-brand-red/20"
          : "bg-white border border-gray-100 text-brand-black"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-black text-white text-xs font-bold px-4 py-1 rounded-full">
          Populaire
        </div>
      )}
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className={cn("text-sm mb-6", highlighted ? "text-white/70" : "text-gray-500")}>
        {description}
      </p>
      <div className="mb-6">
        <span className="text-4xl font-black">{price}</span>
        <span className={cn("text-sm ml-1", highlighted ? "text-white/70" : "text-gray-500")}>
          {period}
        </span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check
              className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                highlighted ? "text-white" : "text-brand-red"
              )}
            />
            <span className={highlighted ? "text-white/90" : "text-gray-600"}>{feature}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <Link
          href={cta.href}
          className={cn(
            "w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all",
            highlighted
              ? "bg-white text-brand-red hover:bg-white/90"
              : "bg-brand-black text-white hover:bg-gray-800"
          )}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
