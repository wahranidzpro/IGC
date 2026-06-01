"use client"

import { useAuth } from "@/hooks/useAuth"
import { Users, DoorOpen, CreditCard, AlertTriangle } from "lucide-react"

const quickActions = [
  { label: "Scanner QR", href: "/dashboard/qr", icon: DoorOpen, color: "bg-purple-500" },
]

const stats = [
  { label: "Présences aujourd'hui", value: "—", icon: DoorOpen, color: "text-blue-600" },
  { label: "Adhérents actifs", value: "—", icon: Users, color: "text-green-600" },
  { label: "Paiements du jour", value: "—", icon: CreditCard, color: "text-purple-600" },
  { label: "Renouvellements", value: "—", icon: AlertTriangle, color: "text-orange-600" },
]

export default function ReceptionPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenue {user?.email?.split("@")[0] || "à la réception"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.label === "Présences aujourd'hui" ? "Mettez à jour vos données Supabase" : ""}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => window.location.href = action.href}
              className="flex items-center gap-3 bg-card border rounded-xl p-5 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Dernières présences</h2>
        <div className="text-center py-8 text-muted-foreground text-sm">
          Connectez Supabase pour voir les données en temps réel
        </div>
      </div>
    </div>
  )
}
