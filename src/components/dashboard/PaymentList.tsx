"use client"

import { CreditCard, ArrowRight } from "lucide-react"
import type { Payment } from "@/types"

interface PaymentListProps {
  payments: Payment[]
}

const statusLabel: Record<string, string> = {
  completed: "Payé",
  pending: "En attente",
  failed: "Échoué",
  refunded: "Remboursé",
}

const statusColor: Record<string, string> = {
  completed: "text-green-600",
  pending: "text-yellow-600",
  failed: "text-red-600",
  refunded: "text-orange-600",
}

export default function PaymentList({ payments }: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Derniers paiements</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement récent</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-semibold">Derniers paiements</h2>
      </div>

      <div className="space-y-3">
        {payments.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{p.amount.toFixed(2)} €</p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.paidAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${statusColor[p.status] || ""}`}>
                {statusLabel[p.status] || p.status}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
