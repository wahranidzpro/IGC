"use client"

import { Clock, LogIn, LogOut } from "lucide-react"
import type { Attendance } from "@/types"

interface AttendanceListProps {
  attendance: Attendance[]
}

export default function AttendanceList({ attendance }: AttendanceListProps) {
  if (attendance.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-white">Dernières présences</h2>
        </div>
        <p className="text-sm text-gray-400 text-center py-8">Aucune présence ce mois-ci</p>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-400" />
        <h2 className="font-semibold text-white">Dernières présences</h2>
      </div>

      <div className="space-y-1">
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
            <div key={a.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                {a.type === "entry" ? (
                  <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <LogIn className="w-3.5 h-3.5 text-green-400" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                )}
                <span className="text-gray-300 font-medium">{dayLabel}</span>
              </div>
              <span className="text-gray-400 text-xs font-medium">
                {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
