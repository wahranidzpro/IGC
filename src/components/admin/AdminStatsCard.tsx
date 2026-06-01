"use client"

import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AdminStatsCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  trend?: "up" | "down"
  trendValue?: string
}

export default function AdminStatsCard({ label, value, sub, icon: Icon, trend, trendValue }: AdminStatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3 text-xs">
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
              {trendValue}
            </span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
