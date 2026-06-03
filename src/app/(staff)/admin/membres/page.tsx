"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Mail, Phone, Calendar, UserCheck } from "lucide-react"

interface MemberRow {
  id: string
  profileId: string
  status: string
  createdAt: string
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
  membership: {
    planName: string
    endDate: string
    status: string
  } | null
}

export default function AdminMembresPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("members")
        .select("*, profile:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(50)
      if (data) {
        const enriched: MemberRow[] = await Promise.all(
          mapRows<any>(data).map(async (m) => {
            const { data: ms } = await supabase
              .from("memberships")
              .select("plan_name, end_date, status")
              .eq("member_id", m.id)
              .eq("status", "active")
              .maybeSingle()
            const membership = mapRow<{ planName: string; endDate: string; status: string }>(ms)
            return { ...m, membership } as MemberRow
          })
        )
        setMembers(enriched)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = members.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    const p = m.profile
    return (
      p?.firstName.toLowerCase().includes(q) ||
      p?.lastName.toLowerCase().includes(q) ||
      p?.email.toLowerCase().includes(q) ||
      p?.phone?.includes(q)
    )
  })

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { label: "Actif", variant: "default" },
    inactive: { label: "Inactif", variant: "secondary" },
    suspended: { label: "Suspendu", variant: "destructive" },
    expired: { label: "Expiré", variant: "destructive" },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-muted-foreground">{members.length} membres inscrits</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun membre trouvé
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((m) => {
                const st = statusBadge[m.status] || { label: m.status, variant: "secondary" as const }
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {m.profile?.firstName} {m.profile?.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.profile?.email}</span>
                          {m.profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.profile.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right text-sm">
                        <p className="font-medium">{m.membership?.planName || "—"}</p>
                        {m.membership && (
                          <p className="text-xs text-muted-foreground">
                            Exp. {new Date(m.membership.endDate).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
