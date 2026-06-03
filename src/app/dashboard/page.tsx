"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Profile, Member, Membership, Attendance } from "@/types"
import {
  Dumbbell, TrendingUp, DoorOpen, CreditCard, Bot, Users,
  CalendarDays, Apple, QrCode, Gift, UserPlus, User,
  ChevronRight, Zap, Building2,
} from "lucide-react"

const sportLinks = [
  { label: "Entraînement", href: "/dashboard/workout", icon: Dumbbell, desc: "Programmes & séances", color: "from-red-500 to-rose-600", bg: "bg-red-50" },
  { label: "Progrès", href: "/dashboard/progress", icon: TrendingUp, desc: "Évolution & statistiques", color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
  { label: "Présences", href: "/dashboard/attendance", icon: DoorOpen, desc: "Historique & fréquence", color: "from-emerald-500 to-green-600", bg: "bg-emerald-50" },
  { label: "Abonnement", href: "/dashboard/membership", icon: CreditCard, desc: "Offres & paiements", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
]

const coachingLinks = [
  { label: "Coach IA", href: "/ai-coach", icon: Bot, desc: "Assistant intelligent 24/7", color: "from-cyan-500 to-blue-600", bg: "bg-cyan-50" },
  { label: "Personal Training", href: "/dashboard/coach", icon: Users, desc: "Coaching personnalisé", color: "from-indigo-500 to-blue-600", bg: "bg-indigo-50" },
  { label: "Réservation", href: "/dashboard/booking", icon: CalendarDays, desc: "Cours & coach", color: "from-pink-500 to-rose-600", bg: "bg-pink-50" },
]

const wellnessLinks = [
  { label: "Nutrition", href: "/dashboard/nutrition", icon: Apple, desc: "Plans alimentaires", color: "from-green-500 to-emerald-600", bg: "bg-green-50" },
  { label: "QR Code", href: "/dashboard/qr", icon: QrCode, desc: "Accès à la salle", color: "from-brand-red to-red-600", bg: "bg-brand-red/5" },
]

const perksLinks = [
  { label: "Bons plans", href: "/dashboard/bon-plan", icon: Gift, desc: "Offres & réductions", color: "from-yellow-500 to-amber-600", bg: "bg-yellow-50" },
  { label: "Parrainage", href: "/dashboard/referral", icon: UserPlus, desc: "Parrainez & gagnez", color: "from-teal-500 to-cyan-600", bg: "bg-teal-50" },
  { label: "Mon profil", href: "/dashboard/profile", icon: User, desc: "Informations personnelles", color: "from-slate-500 to-gray-600", bg: "bg-slate-50" },
]

function SectionCard({ label, href, icon: Icon, desc, color, bg }: {
  label: string; href: string; icon: any; desc: string; color: string; bg: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="group relative bg-white rounded-2xl border border-gray-100 p-5 text-left transition-all duration-200 hover:shadow-xl hover:shadow-black/5 hover:border-brand-red/20 hover:-translate-y-0.5 active:scale-[0.98] before:absolute before:top-0 before:left-4 before:right-4 before:h-0.5 before:bg-gradient-to-r before:from-brand-red before:via-brand-accent before:to-brand-red before:rounded-full before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-6 h-6 text-brand-red" />
      </div>
      <h3 className="text-sm font-bold text-brand-black mb-0.5">{label}</h3>
      <p className="text-xs text-gray-500">{desc}</p>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-brand-red" />
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
        console.error("Erreur chargement dashboard")
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
        <div className="h-52 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="relative bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-5 pt-6 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-red-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/10">
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                      {(profile?.firstName?.[0] || user?.email?.[0] || "M").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white shadow" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Bienvenue</p>
                <h1 className="text-xl font-bold">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-sm text-white/70">Infinity Gym Center</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
              membership ? "bg-green-400/20 text-green-300" : "bg-white/10 text-white/60"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${membership ? "bg-green-400 animate-pulse" : "bg-white/40"}`} />
              {membership ? "Abonnement actif" : "Aucun abonnement"}
            </span>
            {membership && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                <CalendarDays className="w-3.5 h-3.5" />
                {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
              <Zap className="w-3.5 h-3.5" />
              {entryCount} séance{entryCount > 1 ? "s" : ""} ce mois
            </span>
            {member?.clubId && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                <Building2 className="w-3.5 h-3.5" />
                {member.clubId.slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-10 space-y-6 pb-28">
        {membership && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/5 border border-white/50 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Abonnement en cours</span>
              <span className="text-xs font-bold text-brand-red bg-brand-red/5 px-2.5 py-0.5 rounded-full">{membership.planName}</span>
            </div>
            <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-red via-red-500 to-red-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Expire le {new Date(membership.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="font-medium">{daysLeft} jour{daysLeft > 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">Sport</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sportLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">Coaching</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {coachingLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">Bien-être</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {wellnessLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-brand-red rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">Avantages</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {perksLinks.map((link) => (
              <SectionCard key={link.href} {...link} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}