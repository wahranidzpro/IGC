"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Users, Search, Filter, X, ChevronRight, AlertCircle, RefreshCw,
  Phone, Calendar, Dumbbell, Apple, TrendingUp, Activity,
  Mail, Target, Ruler, Weight, Heart, Clock, CreditCard,
} from "lucide-react"
import type { Member, Profile, Membership, Attendance, Payment, ProgressLog } from "@/types"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface MemberWithProfile extends Member {
  profile: Profile
  activeMembership?: Membership | null
}

export default function MembersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all")
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null)
  const [memberAttendance, setMemberAttendance] = useState<Attendance[]>([])
  const [memberPayments, setMemberPayments] = useState<Payment[]>([])
  const [memberProgress, setMemberProgress] = useState<ProgressLog[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const cRow = await supabase.from("coaches").select("id").eq("profile_id", uid).maybeSingle()
          .then(r => mapRow<{ id: string }>(r.data))
        const coachId = cRow?.id
        if (!coachId) { setLoading(false); return }

        const mcRows = await supabase
          .from("member_coaches")
          .select("member_id")
          .eq("coach_id", coachId)
          .eq("is_active", true)
          .then(r => mapRows<{ memberId: string }>(r.data))
        const memberIds = mcRows.map((m) => m.memberId)
        if (memberIds.length === 0) { setLoading(false); return }

        const allMembers = await supabase
          .from("members")
          .select("*")
          .in("id", memberIds)
          .then(r => mapRows<Member>(r.data))

        const pRows = await supabase
          .from("profiles")
          .select("*")
          .in("id", allMembers.map((m) => m.profileId))
          .then(r => mapRows<Profile>(r.data))
        const profiles = pRows.reduce((acc, p) => {
          acc[p.id] = p; return acc
        }, {} as Record<string, Profile>)

        const msRows = await supabase
          .from("memberships")
          .select("*")
          .in("member_id", memberIds)
          .eq("status", "active")
          .then(r => mapRows<Membership>(r.data))
        const activeMemberships = msRows.reduce((acc, m) => {
          if (!acc[m.memberId]) acc[m.memberId] = m; return acc
        }, {} as Record<string, Membership>)

        setMembers(
          allMembers
            .filter((m) => profiles[m.profileId])
            .map((m) => ({
              ...m,
              profile: profiles[m.profileId],
              activeMembership: activeMemberships[m.id] || null,
            }))
        )
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les adhérents")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const loadMemberDetail = async (member: MemberWithProfile) => {
    setSelectedMember(member)
    setDetailLoading(true)
    const supabase = createClient()
    try {
      const [attRows, payRows, progRows] = await Promise.all([
        supabase.from("attendance").select("*").eq("member_id", member.id).order("timestamp", { ascending: false }).limit(20).then(r => mapRows<Attendance>(r.data)),
        supabase.from("payments").select("*").eq("member_id", member.id).order("paid_at", { ascending: false }).limit(10).then(r => mapRows<Payment>(r.data)),
        supabase.from("progress_logs").select("*").eq("member_id", member.id).order("logged_at", { ascending: false }).limit(20).then(r => mapRows<ProgressLog>(r.data)),
      ])
      setMemberAttendance(attRows)
      setMemberPayments(payRows)
      setMemberProgress(progRows)
    } catch { /* ignore */ }
    finally { setDetailLoading(false) }
  }

  const filtered = members.filter((m) => {
    const name = `${m.profile.firstName} ${m.profile.lastName}`.toLowerCase()
    const phone = m.profile.phone || ""
    const q = search.toLowerCase()
    const matchesSearch = name.includes(q) || phone.includes(q)
    const matchesFilter =
      filter === "all" ? true :
      filter === "active" ? m.status === "active" :
      m.status === "expired" || m.status === "inactive"
    return matchesSearch && matchesFilter
  })

  const bmi = (weight: number | null, height: number | null) => {
    if (!weight || !height) return null
    const h = height / 100
    return (weight / (h * h)).toFixed(1)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-9 w-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-base font-bold text-brand-black mb-1">Erreur</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (selectedMember) {
    const p = selectedMember.profile
    const latestProgress = memberProgress[0] || null
    const imc = bmi(latestProgress?.weight ?? selectedMember.weight, selectedMember.height)

    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5">
        <button onClick={() => setSelectedMember(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-black mb-2">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour à la liste
        </button>

        <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-red/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
              {p.avatarUrl ? <Image src={p.avatarUrl} alt="" width={64} height={64} className="w-full h-full rounded-full object-cover" /> : p.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{p.firstName} {p.lastName}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/70">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {p.email}</span>
                {p.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {p.phone}</span>}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              selectedMember.status === "active" ? "bg-green-400 text-green-900" : "bg-white/20 text-white"
            }`}>
              {selectedMember.status === "active" ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Poids", value: latestProgress?.weight ? `${latestProgress.weight} kg` : selectedMember.weight ? `${selectedMember.weight} kg` : "—", icon: Weight },
            { label: "Taille", value: selectedMember.height ? `${selectedMember.height} cm` : "—", icon: Ruler },
            { label: "IMC", value: imc || "—", icon: Heart },
            { label: "Masse musculaire", value: latestProgress?.muscleMass ? `${latestProgress.muscleMass} kg` : "—", icon: Activity },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center"><s.icon className="w-4 h-4 text-brand-red" /></div>
              </div>
              <p className="text-lg font-bold text-brand-black">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {selectedMember.fitnessGoal && (
          <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3">
            <Target className="w-5 h-5 text-brand-red" />
            <div>
              <p className="text-xs text-gray-500">Objectif fitness</p>
              <p className="text-sm font-bold text-brand-black">{selectedMember.fitnessGoal}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-red" /> Progression
          </h3>
          {memberProgress.length < 2 ? (
            <div className="text-center py-6 text-sm text-gray-500">Pas assez de données pour afficher la progression</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[...memberProgress].reverse()}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E10600" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="loggedAt" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#E10600" strokeWidth={2} fill="url(#weightGrad)" name="Poids (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-gray-50">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2"><Clock className="w-4 h-4 text-brand-red" /> Dernières présences</h3>
            </div>
            {memberAttendance.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">Aucune présence enregistrée</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {memberAttendance.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">{new Date(a.timestamp).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-gray-50">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-red" /> Derniers paiements</h3>
            </div>
            {memberPayments.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">Aucun paiement enregistré</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {memberPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-gray-700">{p.amount.toLocaleString()} DZD</p>
                      <p className="text-[10px] text-gray-400">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === "completed" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.push("/coach/programs")} className="flex-1 flex items-center justify-center gap-2 bg-brand-red text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
            <Dumbbell className="w-4 h-4" /> Créer programme
          </button>
          <button onClick={() => router.push("/coach/nutrition")} className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-brand-red text-brand-red py-3 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">
            <Apple className="w-4 h-4" /> Plan nutrition
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Mes adhérents</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} adhérent{members.length > 1 ? "s" : ""} suivi{members.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou téléphone..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20"
        />
      </div>

      <div className="flex gap-1.5">
        {[
          { key: "all" as const, label: "Tous", count: members.length },
          { key: "active" as const, label: "Actifs", count: members.filter((m) => m.status === "active").length },
          { key: "expired" as const, label: "Expirés", count: members.filter((m) => m.status === "expired" || m.status === "inactive").length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f.key ? "bg-brand-red text-white shadow-md shadow-brand-red/20" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-red/30"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucun adhérent trouvé</p>
          <p className="text-xs text-gray-500">{search ? "Essayez un autre terme de recherche" : "Aucun adhérent ne vous est assigné"}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((m) => {
            const name = `${m.profile.firstName} ${m.profile.lastName}`
            const expDate = m.activeMembership?.endDate
            const isExpiring = expDate && new Date(expDate).getTime() - Date.now() < 15 * 24 * 60 * 60 * 1000
            return (
              <button
                key={m.id}
                onClick={() => loadMemberDetail(m)}
                className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold shrink-0">
                  {m.profile.avatarUrl ? (
                    <Image src={m.profile.avatarUrl} alt="" width={48} height={48} className="w-full h-full rounded-full object-cover" />
                  ) : name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-brand-black truncate">{name}</p>
                    {m.status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.profile.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{m.profile.phone}</span>}
                    {m.activeMembership && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isExpiring ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                        {m.activeMembership.planName}
                      </span>
                    )}
                  </div>
                  {expDate && (
                    <p className={`text-[10px] mt-0.5 ${isExpiring ? "text-amber-600 font-medium" : "text-gray-400"}`}>
                      Expire le {new Date(expDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.experienceLevel && (
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{m.experienceLevel}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
