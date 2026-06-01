"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AdminStatsCard from "@/components/admin/AdminStatsCard"
import { DoorOpen, LogIn, LogOut, Clock, Calendar } from "lucide-react"

interface AttendanceRow {
  id: string
  type: "entry" | "exit"
  timestamp: string
  method: string
  member: {
    profile: { firstName: string; lastName: string } | null
  } | null
}

export default function AdminPresencePage() {
  const [todayEntries, setTodayEntries] = useState<AttendanceRow[]>([])
  const [stats, setStats] = useState({ todayEntries: 0, todayExits: 0, uniqueMembers: 0, peakHour: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

      const { data: today } = await supabase
        .from("attendance")
        .select("*, member:members(profile:profiles(*))")
        .gte("timestamp", todayStart)
        .lt("timestamp", todayEnd)
        .order("timestamp", { ascending: false })

      if (today) {
        const rows = today as unknown as AttendanceRow[]
        setTodayEntries(rows)
        const entries = rows.filter((r) => r.type === "entry").length
        const exits = rows.filter((r) => r.type === "exit").length
        const unique = new Set(rows.map((r) => `${r.member?.profile?.firstName ?? ""}${r.member?.profile?.lastName ?? ""}`)).size

        const hourly: Record<number, number> = {}
        rows.forEach((r) => {
          const h = new Date(r.timestamp).getHours()
          hourly[h] = (hourly[h] || 0) + 1
        })
        const peak = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]
        const peakHour = peak ? `${peak[0]}h` : "—"

        setStats({ todayEntries: entries, todayExits: exits, uniqueMembers: unique, peakHour })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Présences</h1>
        <p className="text-muted-foreground">
          Suivi des entrées et sorties du {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard label="Entrées" value={stats.todayEntries} icon={LogIn} />
        <AdminStatsCard label="Sorties" value={stats.todayExits} icon={LogOut} />
        <AdminStatsCard label="Membres uniques" value={stats.uniqueMembers} icon={DoorOpen} />
        <AdminStatsCard label="Heure de pointe" value={stats.peakHour} icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Activité du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune activité aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {a.type === "entry" ? (
                      <LogIn className="w-4 h-4 text-green-500" />
                    ) : (
                      <LogOut className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="font-medium">
                      {a.member?.profile?.firstName} {a.member?.profile?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {a.method === "qr" ? "QR" : a.method === "rfid" ? "RFID" : a.method === "manual" ? "Manuel" : a.method}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
