"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, UserCheck } from "lucide-react"

interface MembershipRow {
  id: string
  planName: string
  type: string
  startDate: string
  endDate: string
  sessionsTotal: number | null
  sessionsUsed: number
  amount: number
  status: string
  autoRenew: boolean
  member: {
    profile: { firstName: string; lastName: string } | null
  } | null
}

export default function AdminAbonnementsPage() {
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("memberships")
        .select("*, member:members(profile:profiles(*))")
        .order("end_date", { ascending: true })
        .limit(50)
      if (data) setMemberships(mapRows<MembershipRow>(data))
      setLoading(false)
    }
    load()
  }, [])

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { label: "Actif", variant: "default" },
    expired: { label: "Expiré", variant: "destructive" },
    cancelled: { label: "Annulé", variant: "secondary" },
    pending: { label: "En attente", variant: "secondary" },
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground">{memberships.length} abonnements</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {memberships.map((ms) => {
              const st = statusBadge[ms.status] || { label: ms.status, variant: "secondary" as const }
              return (
                <div key={ms.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{ms.planName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ms.member?.profile?.firstName} {ms.member?.profile?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className="text-right">
                      <p className="font-bold">{ms.amount.toFixed(2)} €</p>
                      <p className="text-xs text-muted-foreground">{ms.type}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p>Début: {new Date(ms.startDate).toLocaleDateString("fr-FR")}</p>
                      <p>Fin: {new Date(ms.endDate).toLocaleDateString("fr-FR")}</p>
                    </div>
                    {ms.sessionsTotal && (
                      <div className="text-right text-xs">
                        <p>{ms.sessionsUsed}/{ms.sessionsTotal} séances</p>
                      </div>
                    )}
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
