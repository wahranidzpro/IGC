"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts"

const COLORS = ["hsl(346 77% 50%)", "hsl(346 77% 70%)", "hsl(346 77% 30%)", "hsl(0 0% 60%)"]

export default function AdminRevenusPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [byMethod, setByMethod] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()

      const months: any[] = []
      for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = m.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
        const mStart = m.toISOString()
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString()
        const { data: pts } = await supabase
          .from("payments").select("amount").gte("paid_at", mStart).lt("paid_at", mEnd)
        months.push({ month: label, revenu: (mapRows<any>(pts)).reduce((s: number, p: any) => s + p.amount, 0) })
      }
      setMonthlyData(months)

      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount, method")

      if (allPayments && allPayments.length > 0) {
        const grouped: Record<string, number> = {}
        allPayments.forEach((p: any) => {
          grouped[p.method] = (grouped[p.method] || 0) + p.amount
        })
        const labels: Record<string, string> = {
          cash: "Espèces", card: "Carte", transfer: "Virement", mobile_money: "Mobile Money",
        }
        setByMethod(Object.entries(grouped).map(([method, total]) => ({
          name: labels[method] || method,
          value: total,
        })))
      } else {
        setByMethod([])
      }

      setLoading(false)
    }
    load()
  }, [])

  const total = monthlyData.reduce((s, m) => s + m.revenu, 0)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-40 bg-muted rounded" />
        <div className="h-72 bg-muted rounded-xl" />
        <div className="h-72 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenus</h1>
        <p className="text-2xl font-bold text-primary mt-1">{total.toFixed(2)} €</p>
        <p className="text-xs text-muted-foreground">Total 12 derniers mois</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
                  formatter={(value) => [`${Number(value).toFixed(2)} €`, "Revenu"]}
                />
                <Bar dataKey="revenu" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par moyen de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            {byMethod.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} €`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.filter(m => m.revenu > 0).slice(-3).reverse().map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{m.month}</span>
                <span className="font-bold">{m.revenu.toFixed(2)} €</span>
              </div>
            ))}
            <div className="border-t pt-3 flex items-center justify-between text-sm font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
