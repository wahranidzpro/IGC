"use client"

import { useEffect, useState, useMemo } from "react"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Profile, Member, Membership, Attendance } from "@/types"
import {
  Dumbbell, TrendingUp, DoorOpen, CreditCard, Bot, Users,
  CalendarDays, Apple, QrCode, Gift, UserPlus, User,
  ChevronRight, Zap, Building2, Trophy, Sparkles, Award,
  Flame, Heart, Target, ArrowRight, Play, Star,
} from "lucide-react"
import AttendanceList from "@/components/dashboard/AttendanceList"

const sportLinks = [
  { label: "Entra\u00eenement", href: "/dashboard/workout", icon: Dumbbell, desc: "Programmes & s\u00e9ances", color: "from-[#0A84FF] to-[#38B6FF]", emoji: "\uD83C\uDFCB" },
  { label: "Mes Progr\u00e8s", href: "/dashboard/progress", icon: TrendingUp, desc: "\u00c9volution & statistiques", color: "from-[#00D4FF] to-[#0A84FF]", emoji: "\uD83D\uDCC8" },
  { label: "Pr\u00e9sences", href: "/dashboard/attendance", icon: DoorOpen, desc: "Historique & fr\u00e9quence", color: "from-[#10B981] to-[#34D399]", emoji: "\uD83D\uDEAA" },
  { label: "Abonnement", href: "/dashboard/membership", icon: CreditCard, desc: "Offres & paiements", color: "from-[#C89B3C] to-[#E0B85D]", emoji: "\uD83D\uDCB3" },
]

const coachingLinks = [
  { label: "Coach IA", href: "/ai-coach", icon: Bot, desc: "Assistant intelligent 24/7", color: "from-[#7C3AED] to-[#A855F7]", emoji: "\uD83E\uDD16" },
  { label: "Personal Training", href: "/dashboard/coach", icon: Users, desc: "Coaching personnalis\u00e9", color: "from-[#0A84FF] to-[#00D4FF]", emoji: "\uD83D\uDC6B" },
  { label: "R\u00e9servation", href: "/dashboard/booking", icon: CalendarDays, desc: "Cours & coach", color: "from-[#FF4D4D] to-[#FF6B6B]", emoji: "\uD83D\uDCC5" },
]

const wellnessLinks = [
  { label: "Nutrition", href: "/dashboard/nutrition", icon: Apple, desc: "Plans alimentaires", color: "from-[#10B981] to-[#34D399]", emoji: "\uD83E\uDD55" },
  { label: "QR Code", href: "/dashboard/qr", icon: QrCode, desc: "Acc\u00e8s \u00e0 la salle", color: "from-[#C89B3C] to-[#E0B85D]", emoji: "\uD83D\uDD0D" },
]

const perksLinks = [
  { label: "Bons plans", href: "/dashboard/bon-plan", icon: Gift, desc: "Offres & r\u00e9ductions", color: "from-[#C89B3C] to-[#E0B85D]", emoji: "\uD83C\uDF81" },
  { label: "Parrainage", href: "/dashboard/referral", icon: UserPlus, desc: "Parrainez & gagnez", color: "from-[#00D4FF] to-[#0A84FF]", emoji: "\uD83E\uDD1D" },
  { label: "Mon profil", href: "/dashboard/profile", icon: User, desc: "Informations personnelles", color: "from-[#7C3AED] to-[#A855F7]", emoji: "\uD83D\uDC64" },
]

function SectionCard({ label, href, icon: Icon, desc, color, emoji }: {
  label: string; href: string; icon: any; desc: string; color: string; emoji?: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="group relative glass rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] active:scale-[0.98] overflow-hidden"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent group-hover:scale-150 transition-transform duration-500" />
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[${color.split(" ")[0]}/30]`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-bold text-white mb-0.5">{label}</h3>
      <p className="text-xs text-[#B8C0CC]">{desc}</p>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <ChevronRight className="w-4 h-4 text-[#0A84FF]" />
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
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
        }
      } catch {
        logger.error('Erreur chargement dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const daysLeft = membership
    ? Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const totalDays = membership
    ? Math.ceil((new Date(membership.endDate).getTime() - new Date(membership.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 30
  const entryCount = attendance.filter((a) => a.type === "entry").length
  const progressPct = membership ? Math.min(100, Math.max(0, ((totalDays - Math.max(0, daysLeft)) / totalDays) * 100)) : 0

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="h-64 rounded-3xl shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="h-6 w-32 shimmer rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl shimmer" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Athlete */}
      <div className="relative overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-28 md:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(10,132,255,0.08)] via-[rgba(7,19,38,0.5)] to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[rgba(10,132,255,0.06)] rounded-full blur-[100px]" />
        <div className="absolute top-10 right-20 w-[400px] h-[400px] bg-[rgba(200,155,60,0.05)] rounded-full blur-[80px]" />

        {/* Athlete silhouette - right side */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none overflow-hidden opacity-60">
          <div className="absolute inset-0 bg-gradient-to-l from-[rgba(10,132,255,0.08)] via-[rgba(10,132,255,0.02)] to-transparent" />
          <svg viewBox="0 0 400 600" className="absolute right-0 bottom-0 h-full w-auto opacity-40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="athleteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.1" />
                <stop offset="40%" stopColor="#C89B3C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="athleteGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#C89B3C" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Athlete bodybuilder silhouette - side view with dumbbell */}
            <g fill="url(#athleteGrad)" filter="url(#glow)">
              <path d="M280 80c0 0 15-10 25-5s10 15 10 15l-10 5c0 0-5-10-15-8s-10 8-10 8v-15z" />
              <path d="M300 95c0 0 20-5 25 5s0 20-5 25l-10-5c0 0 8-10 3-15s-13-5-13-5v-5z" />
              <path d="M250 100c0 0-15-15-25-10s-8 18-8 18l10 8c0 0 5-12 15-10s8 8 8 8v-14z" />
              <path d="M225 118c0 0-20-8-25 2s0 20 5 25l10-8c0 0-8-10-3-15s13-5 13-5v1z" />
              {/* Head */}
              <ellipse cx="265" cy="60" rx="22" ry="25" />
              {/* Neck */}
              <rect x="258" y="82" width="14" height="12" rx="4" />
              {/* Torso */}
              <path d="M235 100c0 0-10 60-5 100s10 60 15 80h30c5-20 10-40 15-80s-5-100-5-100h-50z" />
              {/* Left arm raised (dumbbell) */}
              <path d="M235 110c-15 10-30 25-35 40s-5 20-5 20l12 5c0 0 5-10 15-18s15-15 18-22l-5-25z" />
              {/* Right arm (curling) */}
              <path d="M290 115c15 5 30 15 35 30l-12 8c-3-8-10-15-18-20s-10-10-10-10l5-8z" />
              {/* Dumbbell */}
              <path d="M248 128c-3-2-8 0-10 5s-2 10 0 12 8-2 10-5 2-10 0-12z" />
              <rect x="240" y="130" width="8" height="4" rx="1" />
              <rect x="250" y="130" width="8" height="4" rx="1" />
              {/* Legs */}
              <path d="M240 280c-5 20-15 60-15 100v60h-15v-60c0-40 10-80 15-100h15z" />
              <path d="M270 280c5 20 15 60 15 100v60h15v-60c0-40-10-80-15-100h-15z" />
            </g>
            {/* Gold glow accent */}
            <ellipse cx="265" cy="200" rx="80" ry="120" fill="url(#athleteGlow)" opacity="0.3" />
          </svg>
          {/* Neon light rays from athlete */}
          <div className="absolute top-1/4 right-0 w-32 h-32 bg-gradient-to-bl from-[#0A84FF]/20 to-transparent blur-3xl" />
          <div className="absolute top-1/3 right-[10%] w-24 h-24 bg-gradient-to-bl from-[#C89B3C]/15 to-transparent blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          {/* Welcome text */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(10,132,255,0.1)] text-[#0A84FF] text-xs font-bold tracking-wide border border-[rgba(10,132,255,0.2)]">
              <Sparkles className="w-3 h-3" /> Fitness Premium
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(200,155,60,0.1)] text-[#C89B3C] text-xs font-bold tracking-wide border border-[rgba(200,155,60,0.2)]">
              <Award className="w-3 h-3" /> Membre Gold
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mt-3">
            Bienvenue,{" "}
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#00D4FF] to-[#C89B3C] bg-clip-text text-transparent">
              {profile?.firstName || user?.email?.split("@")[0] || "Membre"}
            </span>
          </h1>
          <p className="text-lg text-[#B8C0CC] mt-2 max-w-xl">
            Pr\u00eat \u00e0 d\u00e9passer tes limites aujourd'hui\u202f?
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
              <span className={`w-1.5 h-1.5 rounded-full ${membership ? "bg-[#10B981] animate-pulse" : "bg-[#B8C0CC]"}`} />
              {membership ? "Abonnement actif" : "Aucun abonnement"}
            </span>
            {membership && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[rgba(200,155,60,0.1)] text-[#C89B3C] border border-[rgba(200,155,60,0.2)]">
                <CalendarDays className="w-3.5 h-3.5" />
                {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[rgba(10,132,255,0.1)] text-[#0A84FF] border border-[rgba(10,132,255,0.2)]">
              <Flame className="w-3.5 h-3.5" />
              {entryCount} s\u00e9ance{entryCount > 1 ? "s" : ""} ce mois
            </span>
          </div>

          {/* Membership progress bar */}
          {membership && (
            <div className="mt-6 glass rounded-2xl p-5 border border-[rgba(255,255,255,0.06)] max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">{membership.planName}</span>
                    <span className="text-[10px] text-[#B8C0CC] ml-2">Abonnement en cours</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#C89B3C] bg-[rgba(200,155,60,0.1)] px-2.5 py-1 rounded-full border border-[rgba(200,155,60,0.2)]">
                  {daysLeft}j restant
                </span>
              </div>
              <div className="relative h-2.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0A84FF] via-[#00D4FF] to-[#C89B3C] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#B8C0CC]">
                <span>Expire le {membership ? new Date(membership.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                <span className="font-medium text-white">{Math.round(progressPct)}%</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => router.push("/dashboard/workout")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white font-bold text-sm shadow-lg shadow-[#0A84FF]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group"
          >
            D\u00e9couvrir nos programmes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="px-4 md:px-6 lg:px-8 -mt-8 relative z-10 space-y-8 pb-16">
        {/* Sport Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#38B6FF] flex items-center justify-center shadow-lg shadow-[#0A84FF]/30">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#B8C0CC]">Sport</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sportLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        {/* Coaching Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#B8C0CC]">Coaching</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {coachingLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        {/* Attendance / Présences Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <DoorOpen className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#B8C0CC]">Présences</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-strong rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center mb-3 shadow-lg shadow-[#10B981]/30">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-black text-white">{entryCount}</span>
              <span className="text-sm text-gray-400 mt-1">séance{entryCount > 1 ? "s" : ""} ce mois</span>
            </div>
            <AttendanceList attendance={attendance} />
          </div>
        </div>

        {/* Wellness Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#B8C0CC]">Bien-\u00eatre</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {wellnessLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        {/* Avantages Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center shadow-lg shadow-[#C89B3C]/30">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#B8C0CC]">Avantages</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {perksLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        {/* Motivational Section */}
        <div className="relative overflow-hidden rounded-3xl glass border border-[rgba(255,255,255,0.06)] p-8 md:p-12 mt-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(10,132,255,0.08)] via-[rgba(200,155,60,0.05)] to-[rgba(124,58,237,0.08)]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A84FF]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C89B3C]/5 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(200,155,60,0.3)]">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">
              DEVENEZ LA MEILLEURE VERSION<br />
              <span className="bg-gradient-to-r from-[#0A84FF] via-[#00D4FF] to-[#C89B3C] bg-clip-text text-transparent">
                DE VOUS-M\u00caME
              </span>
            </h2>
            <p className="text-[#B8C0CC] text-sm max-w-lg mx-auto mb-6">
              Chaque s\u00e9ance compte. Chaque effort te rapproche de ton objectif. 
              L'\u00e9chec n'est pas une option.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push("/dashboard/workout")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white font-bold text-sm shadow-lg shadow-[#0A84FF]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Play className="w-4 h-4" /> D\u00e9couvrir nos programmes
              </button>
              <button
                onClick={() => router.push("/dashboard/progress")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-light text-[#B8C0CC] hover:text-white text-sm font-bold border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-200"
              >
                Mes Progr\u00e8s
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
