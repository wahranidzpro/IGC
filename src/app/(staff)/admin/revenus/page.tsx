"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import AdminStatsCard from "@/components/admin/AdminStatsCard"
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, CreditCard, Wallet, Calendar } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts"

const CHART_COLORS = ["#0A84FF", "#00D4FF", "#10B981", "#C89B3C", "#7C3AED", "#FF4D4D"]

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
          cash: "Esp\u00e8ces", card: "Carte", transfer: "Virement", mobile_money: "Mobile Money",
        }
        setByMethod(Object.entries(grouped).map(([method, total]) => ({
          name: labels[method] || method,
          value: total,
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  const total = monthlyData.reduce((s, m) => s + m.revenu, 0)
  const avgMonthly = monthlyData.length > 0 ? Math.round(total / monthlyData.length) : 0
  const bestMonth = monthlyData.reduce((best, m) => m.revenu > (best?.revenu || 0) ? m : best, null as any)
  const growth = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 1].revenu - monthlyData[monthlyData.length - 2].revenu
    : 0

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
          <p className="text-[#A8B2C7] text-xs font-semibold mb-1">{label}</p>
          <p className="text-white font-bold text-lg">{Number(payload[0].value).toLocaleString()} DA</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="h-80 rounded-2xl shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">REVENUS</h1>
          </div>
          <p className="text-[#A8B2C7] text-sm ml-[52px]">Analyse financi\u00e8re du centre</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard label="Total 12 Mois" value={`${total.toLocaleString()} DA`} icon={DollarSign} color="green" sub={`${(total / 12).toLocaleString()} DA/mois`} />
        <AdminStatsCard label="Moyenne Mensuelle" value={`${avgMonthly.toLocaleString()} DA`} icon={BarChart3} color="blue" />
        <AdminStatsCard
          label="Variation"
          value={`${growth >= 0 ? "+" : ""}${growth.toLocaleString()} DA`}
          icon={growth >= 0 ? TrendingUp : TrendingDown}
          color={growth >= 0 ? "green" : "orange"}
        />
        <AdminStatsCard label="Meilleur Mois" value={bestMonth?.month || "—"} icon={TrendingUp} color="gold" sub={bestMonth ? `${bestMonth.revenu.toLocaleString()} DA` : ""} />
      </div>

      {/* Monthly Revenue Chart */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#10B981]" /> Revenus mensuels
          </span>
        </h2>
        <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenu" stroke="#10B981" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Breakdown */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">
            <span className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#0A84FF]" /> R\u00e9partition par moyen de paiement
            </span>
          </h2>
          <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
            {byMethod.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={byMethod}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {byMethod.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span className="text-[#A8B2C7] text-xs">{value}</span>}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                              <p className="text-white font-bold">{Number(payload[0].value).toLocaleString()} DA</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Wallet className="w-10 h-10 text-[#A8B2C7]/30 mx-auto mb-3" />
                <p className="text-[#A8B2C7] text-sm">Donn\u00e9es non disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C89B3C]" /> R\u00e9capitulatif
            </span>
          </h2>
          <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
            <div className="space-y-3">
              {monthlyData.filter(m => m.revenu > 0).slice(-6).reverse().map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <span className="text-sm text-[#A8B2C7]">{m.month}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-500"
                        style={{ width: `${(m.revenu / Math.max(...monthlyData.map(d => d.revenu))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white w-24 text-right">{m.revenu.toLocaleString()} DA</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-4 pt-4">
              <div className="flex items-center justify-between px-3">
                <span className="text-sm font-bold text-white">Total 12 mois</span>
                <span className="text-lg font-black text-white">{total.toLocaleString()} DA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
