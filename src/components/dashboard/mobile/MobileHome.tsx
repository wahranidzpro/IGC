"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import type { Profile, Member, Membership, Attendance, Schedule } from "@/types"
import { genderThemes, type Gender } from "./theme"
import HeroBanner from "./HeroBanner"
import CarteAbonnement from "./CarteAbonnement"
import ActionsRapides from "./ActionsRapides"
import ProchainCours from "./ProchainCours"
import BlocProgrès from "./BlocProgrès"
import SuggestionExercice from "./SuggestionExercice"

const sectionAnim = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function MobileHome() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [nextCourse, setNextCourse] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)

  const uid = user?.id as string

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function load() {
      try {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle()
        if (p) setProfile(mapRow<Profile>(p))

        const { data: mData } = await supabase.from("members").select("*").eq("profile_id", uid).maybeSingle()
        const memberRow = mData ? mapRow<Member>(mData) : null
        if (memberRow) setMember(memberRow)

        if (memberRow) {
          const { data: ms } = await supabase
            .from("memberships")
            .select("*")
            .eq("member_id", memberRow.id)
            .eq("status", "active")
            .maybeSingle()
          if (ms) setMembership(mapRow<Membership>(ms))

          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          const { data: a } = await supabase
            .from("attendance")
            .select("*")
            .eq("member_id", memberRow.id)
            .gte("timestamp", startOfMonth)
            .limit(50)
          if (a) setAttendance(mapRows<Attendance>(a))

          const { data: s } = await supabase
            .from("schedules")
            .select("*")
            .eq("member_id", memberRow.id)
            .gte("start_time", now.toISOString())
            .order("start_time", { ascending: true })
            .limit(1)
            .maybeSingle()
          if (s) setNextCourse(mapRow<Schedule>(s))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, uid])

  useEffect(() => {
    if (!member?.id) return
    const supabase = createClient()

    const channel = supabase
      .channel("mobile_attendance_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `member_id=eq.${member.id}`,
        },
        async () => {
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          const { data: a } = await supabase
            .from("attendance")
            .select("*")
            .eq("member_id", member.id)
            .gte("timestamp", startOfMonth)
            .limit(50)
          if (a) setAttendance(mapRows<Attendance>(a))
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [member?.id])

  const gender: Gender = (member?.gender as Gender) || (profile ? "male" : "other") || "other"
  const theme = genderThemes[gender] || genderThemes.other

  const firstName = profile?.firstName || (user && "firstName" in user ? (user as any).firstName : null) || "Karim"
  const daysLeft = membership
    ? Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const totalDays = membership
    ? Math.ceil((new Date(membership.endDate).getTime() - new Date(membership.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 30
  const entryCount = attendance.filter((a) => a.type === "entry").length
  const progressPct = membership ? Math.min(100, Math.max(0, ((totalDays - Math.max(0, daysLeft)) / totalDays) * 100)) : 0

  const courseData = nextCourse
    ? {
        title: nextCourse.title,
        startTime: new Date(nextCourse.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        endTime: new Date(nextCourse.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        coachName: "",
        room: "",
        duration: `${Math.round((new Date(nextCourse.endTime).getTime() - new Date(nextCourse.startTime).getTime()) / 60000)} min`,
      }
    : null

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="h-[35vh] min-h-[280px] rounded-3xl shimmer" />
        <div className="h-[110px] rounded-3xl shimmer mx-4" />
        <div className="grid grid-cols-2 gap-3 mt-6 px-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-[20px] shimmer" />)}
        </div>
        <div className="h-24 rounded-[20px] shimmer mx-4" />
        <div className="h-24 rounded-[20px] shimmer mx-4" />
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)",
      }}
      variants={container}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <HeroBanner
          firstName={firstName}
          gender={gender}
          membershipActive={!!membership}
          planName={membership?.planName}
          daysLeft={daysLeft}
        />
      </motion.div>

      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <CarteAbonnement
          gender={gender}
          planName={membership?.planName || "Premium"}
          startDate={membership?.startDate || ""}
          endDate={membership?.endDate || ""}
          daysLeft={daysLeft}
          isActive={!!membership}
        />
      </motion.div>

      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <ActionsRapides />
      </motion.div>

      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <SuggestionExercice gender={gender} />
      </motion.div>

      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <ProchainCours gender={gender} course={courseData} />
      </motion.div>

      <motion.div variants={sectionAnim} transition={{ duration: 0.4 }}>
        <BlocProgrès
          gender={gender}
          sessionsThisMonth={entryCount}
          progressPct={Math.round(progressPct)}
          goalsCount={member?.fitnessGoal ? 3 : 0}
        />
      </motion.div>

      <div className="h-24" />
    </motion.div>
  )
}
