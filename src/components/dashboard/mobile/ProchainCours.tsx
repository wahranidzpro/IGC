"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, MapPin } from "lucide-react"
import type { Gender } from "./theme"

interface Course {
  title: string
  startTime: string
  endTime: string
  coachName: string
  room: string
  duration: string
  image?: string
}

interface ProchainCoursProps {
  gender: Gender
  course: Course | null
}

export default function ProchainCours({ gender, course }: ProchainCoursProps) {
  const router = useRouter()
  const isToday = true

  if (!course) {
    return (
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">PROCHAIN COURS</h3>
        </div>
        <div
          className="rounded-[20px] p-5 text-center border border-dashed"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
        >
          <p className="text-sm text-gray-500">Aucun cours prévu</p>
          <button
            onClick={() => router.push("/dashboard/planning")}
            className="text-xs font-bold mt-2 underline underline-offset-2"
            style={{ color: gender === "male" ? "#0A84FF" : "#10B981" }}
          >
            Voir le planning
          </button>
        </div>
      </div>
    )
  }

  const primary = gender === "male" ? "#0A84FF" : gender === "female" ? "#10B981" : "#7C3AED"

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">PROCHAIN COURS</h3>
        <button
          onClick={() => router.push("/dashboard/planning")}
          className="text-[10px] font-bold"
          style={{ color: primary }}
        >
          VOIR LE PLANNING &gt;
        </button>
      </div>

      <button onClick={() => router.push("/dashboard/planning")} className="relative w-full rounded-[20px] overflow-hidden border text-left transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.04]" style={{ borderColor: "rgba(255,255,255,0.08)", cursor: "pointer" }}>
        {course.image && (
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${course.image})` }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,21,59,0.95) 0%, rgba(8,21,59,0.6) 100%)" }} />
          </div>
        )}

        <div className="relative flex items-center p-4 gap-4">
          <div
            className="rounded-2xl px-4 py-3 text-center min-w-[70px]"
            style={{ background: `${primary}20` }}
          >
            <p className="text-lg font-black text-white">{course.startTime}</p>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: primary }}>
              {isToday ? "AUJOURD'HUI" : "À VENIR"}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{course.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {course.duration} · Avec {course.coachName}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <p className="text-[10px] text-gray-500 truncate">{course.room}</p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </button>
    </div>
  )
}
