"use client"

import { Clock, LogIn, LogOut } from "lucide-react"
import type { Attendance } from "@/types"

interface AttendanceListProps {
  attendance: Attendance[]
}

export default function AttendanceList({ attendance }: AttendanceListProps) {
  if (attendance.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Dernières présences</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">Aucune présence ce mois-ci</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-semibold">Dernières présences</h2>
      </div>

      <div className="space-y-3">
        {attendance.slice(0, 10).map((a) => {
          const date = new Date(a.timestamp)
          const today = new Date()
          const isToday = date.toDateString() === today.toDateString()
          const yesterday = new Date(today.setDate(today.getDate() - 1))
          const isYesterday = date.toDateString() === yesterday.toDateString()

          const dayLabel = isToday
            ? "Aujourd'hui"
            : isYesterday
              ? "Hier"
              : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })

          return (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {a.type === "entry" ? (
                  <LogIn className="w-4 h-4 text-green-500" />
                ) : (
                  <LogOut className="w-4 h-4 text-orange-500" />
                )}
                <span>{dayLabel}</span>
              </div>
              <span className="text-muted-foreground">
                {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
