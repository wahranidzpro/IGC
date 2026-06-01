"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { QrCode, CreditCard, DoorOpen, ChevronRight, CalendarDays } from "lucide-react"
import type { Profile, Member, Membership, Attendance, Payment, Club } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const uid = user.id
    const supabase = createClient()

    async function load() {
      try {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).single()
        if (p) setProfile(p as unknown as Profile)

        const { data: mData } = await supabase.from("members").select("*").eq("profileId", uid).maybeSingle()
        const memberRow = mData as Member | null
        if (memberRow) setMember(memberRow)

        if (memberRow) {
          if (memberRow.clubId) {
            const { data: c } = await supabase.from("clubs").select("*").eq("id", memberRow.clubId).single()
            if (c) setClub(c as unknown as Club)
          }

          const { data: ms } = await supabase
            .from("memberships")
            .select("*")
            .eq("memberId", memberRow.id)
            .eq("status", "active")
            .maybeSingle()
          if (ms) setMembership(ms as unknown as Membership)

          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

          const { data: a } = await supabase
            .from("attendance")
            .select("*")
            .eq("memberId", memberRow.id)
            .gte("timestamp", startOfMonth)
            .order("timestamp", { ascending: false })
            .limit(10)
          if (a) setAttendance(a as unknown as Attendance[])

          const { data: pts } = await supabase
            .from("payments")
            .select("*")
            .eq("memberId", memberRow.id)
            .order("paidAt", { ascending: false })
            .limit(5)
          if (pts) setPayments(pts as unknown as Payment[])
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
  const entryCount = attendance.filter((a) => a.type === "entry").length

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-b from-brand-red to-red-800 px-5 pt-6 pb-20 text-white">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg bg-white/10">
              {profile?.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                  {(profile?.firstName?.[0] || user?.email?.[0] || "M").toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {profile?.firstName} {profile?.lastName}
            </h1>
            <p className="text-sm text-white/70 truncate">
              {club?.name || "Infinity Gym Center"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
            membership
              ? "bg-green-400/20 text-green-300"
              : "bg-white/10 text-white/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${membership ? "bg-green-400" : "bg-white/40"}`} />
            {membership ? "Abonnement actif" : "Aucun abonnement"}
          </span>
          {membership && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80">
              <CalendarDays className="w-3.5 h-3.5" />
              {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-gray-50" />
      </div>

      <div className="px-4 -mt-12 relative z-10 space-y-4 pb-24">
        {membership && (
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Abonnement en cours</span>
              <span className="text-xs font-bold text-brand-red">{membership.planName}</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-red to-red-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((daysLeft > 0 ? 30 - daysLeft : 30) / 30) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Expire le {new Date(membership.endDate).toLocaleDateString("fr-FR")}</span>
              <span>{entryCount} séance{entryCount > 1 ? "s" : ""} ce mois</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/dashboard/qr")}
            className="bg-white rounded-2xl shadow-lg shadow-black/5 p-5 border border-gray-100 text-left hover:shadow-xl hover:border-brand-red/20 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mb-3 group-hover:bg-brand-red group-hover:scale-110 transition-all">
              <QrCode className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-bold text-brand-black">Mon QR Code</p>
            <p className="text-xs text-gray-500 mt-0.5">Accès à la salle</p>
          </button>

          <button
            onClick={() => router.push("/dashboard/membership")}
            className="bg-white rounded-2xl shadow-lg shadow-black/5 p-5 border border-gray-100 text-left hover:shadow-xl hover:border-brand-red/20 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-500 group-hover:scale-110 transition-all">
              <CreditCard className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-bold text-brand-black">Mon abonnement</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {membership ? `${daysLeft} jours restants` : "Voir les offres"}
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard/attendance")}
            className="bg-white rounded-2xl shadow-lg shadow-black/5 p-5 border border-gray-100 text-left hover:shadow-xl hover:border-brand-red/20 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-3 group-hover:bg-purple-500 group-hover:scale-110 transition-all">
              <DoorOpen className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-bold text-brand-black">Mes présences</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {entryCount > 0 ? `${entryCount} séance${entryCount > 1 ? "s" : ""} ce mois` : "Aucune présence"}
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard/membership")}
            className="bg-white rounded-2xl shadow-lg shadow-black/5 p-5 border border-gray-100 text-left hover:shadow-xl hover:border-brand-red/20 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:scale-110 transition-all">
              <CreditCard className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-bold text-brand-black">Mes paiements</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {payments.length > 0
                ? `${payments.length} paiement${payments.length > 1 ? "s" : ""}`
                : "Aucun paiement"}
            </p>
          </button>
        </div>

        {attendance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-brand-black">Dernières présences</h3>
              <button
                onClick={() => router.push("/dashboard/attendance")}
                className="text-xs text-brand-red font-medium flex items-center gap-0.5"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {attendance.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${a.type === "entry" ? "bg-green-500" : "bg-orange-400"}`} />
                    <span className="text-sm text-gray-700">{a.type === "entry" ? "Entrée" : "Sortie"}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(a.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {" "}
                    {new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-brand-black">Paiements récents</h3>
              <button
                onClick={() => router.push("/dashboard/membership")}
                className="text-xs text-brand-red font-medium flex items-center gap-0.5"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {payments.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      p.status === "completed"
                        ? "bg-green-50 text-green-600"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      DZD
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 capitalize">{p.method?.replace("_", " ") || "Paiement"}</p>
                      <p className="text-[10px] text-gray-400">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-brand-black">{p.amount.toLocaleString()} DZD</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
