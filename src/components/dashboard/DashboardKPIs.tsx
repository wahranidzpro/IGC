"use client"

import { Calendar, Dumbbell, CreditCard, AlertCircle } from "lucide-react"
import type { Membership } from "@/types"
import type { Payment } from "@/types"

interface DashboardKPIsProps {
  membership: Membership | null
  attendanceCount: number
  nextPayment: Payment | null
}

export default function DashboardKPIs({ membership, attendanceCount, nextPayment }: DashboardKPIsProps) {
  const kpiCards = [
    {
      icon: membership ? Dumbbell : AlertCircle,
      label: "Abonnement",
      value: membership ? membership.planName : "Aucun",
      sub: membership
        ? `Expire le ${new Date(membership.endDate).toLocaleDateString("fr-FR")}`
        : null,
    },
    {
      icon: Calendar,
      label: "Présences",
      value: `${attendanceCount} séance${attendanceCount > 1 ? "s" : ""}`,
      sub: "Ce mois-ci",
    },
    {
      icon: CreditCard,
      label: "Prochain paiement",
      value: nextPayment ? `${nextPayment.amount.toFixed(2)} €` : "Aucun",
      sub: nextPayment
        ? `Le ${new Date(nextPayment.paidAt).toLocaleDateString("fr-FR")}`
        : null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 md:px-6">
      {kpiCards.map((card, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <card.icon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
          </div>
          <p className="text-lg font-bold">{card.value}</p>
          {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
        </div>
      ))}
    </div>
  )
}
