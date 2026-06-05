"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Users, Search, Eye, MessageCircle, Plus, ChevronRight,
  AlertCircle, RefreshCw, Phone, Calendar, Dumbbell, Apple,
  TrendingUp, Activity, Mail, Target, Ruler, Weight, Heart,
  Clock, CreditCard, Filter,
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
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "new">("all")
  const [sort, setSort] = useState<"name" | "date" | "progress">("name")
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
      filter === "new" ? new Date(m.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 :
      m.status === "expired" || m.status === "inactive"
    return matchesSearch && matchesFilter
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") {
      return `${a.profile.firstName} ${a.profile.lastName}`.localeCompare(`${b.profile.firstName} ${b.profile.lastName}`)
    }
    if (sort === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return 0
  })

  const calcProgress = (m: MemberWithProfile) => {
    if (!m.activeMembership || !m.activeMembership.sessionsTotal) return 0
    return Math.min(100, Math.round((m.activeMembership.sessionsUsed / m.activeMembership.sessionsTotal) * 100))
  }

  const bmi = (weight: number | null, height: number | null) => {
    if (!weight || !height) return null
    const h = height / 100
    return (weight / (h * h)).toFixed(1)
  }

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: "Actif", color: "text-green-400 bg-green-500/10 border-green-500/20", dot: "bg-green-400" },
    expired: { label: "Expiré", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
    inactive: { label: "Inactif", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400" },
    new: { label: "Nouveau", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400" },
  }

  const getStatus = (m: MemberWithProfile) => {
    const isNew = new Date(m.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    if (isNew) return statusConfig.new
    return statusConfig[m.status] || statusConfig.inactive
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse backdrop-blur-xl" />
        <div className="h-12 bg-white/5 rounded-xl animate-pulse backdrop-blur-xl" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-9 w-20 bg-white/5 rounded-xl animate-pulse backdrop-blur-xl" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white/5 rounded-2xl animate-pulse backdrop-blur-xl border border-white/10" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-base font-bold text-white mb-1">Erreur</p>
          <p className="text-sm text-white/50 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-bold text-white bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-[#C89B3C]/20">
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
      <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
        <button onClick={() => setSelectedMember(null)} className="flex items-center gap-1 text-sm text-white/50 hover:text-[#C89B3C] transition-colors mb-2">
          <ChevronRight className="w-4 h-4 rotate-180" /> Retour à la liste
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center text-xl font-bold text-black shrink-0">
              {p.avatarUrl ? <Image src={p.avatarUrl} alt="" width={64} height={64} className="w-full h-full rounded-full object-cover" /> : p.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{p.firstName} {p.lastName}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {p.email}</span>
                {p.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {p.phone}</span>}
              </div>
            </div>
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", getStatus(selectedMember).color)}>
              {getStatus(selectedMember).label}
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
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#C89B3C]/10 flex items-center justify-center"><s.icon className="w-4 h-4 text-[#C89B3C]" /></div>
              </div>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {selectedMember.fitnessGoal && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <Target className="w-5 h-5 text-[#C89B3C]" />
            <div>
              <p className="text-xs text-white/40">Objectif fitness</p>
              <p className="text-sm font-bold text-white">{selectedMember.fitnessGoal}</p>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C89B3C]" /> Progression
          </h3>
          {memberProgress.length < 2 ? (
            <div className="text-center py-6 text-sm text-white/40">Pas assez de données pour afficher la progression</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[...memberProgress].reverse()}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C89B3C" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#C89B3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="loggedAt" tick={{ fontSize: 10, fill: "#ffffff40" }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} />
                <YAxis tick={{ fontSize: 10, fill: "#ffffff40" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(12px)" }} />
                <Area type="monotone" dataKey="weight" stroke="#C89B3C" strokeWidth={2} fill="url(#weightGrad)" name="Poids (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-[#C89B3C]" /> Dernières présences</h3>
            </div>
            {memberAttendance.length === 0 ? (
              <div className="text-center py-6 text-sm text-white/40">Aucune présence enregistrée</div>
            ) : (
              <div className="divide-y divide-white/10">
                {memberAttendance.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-white/70">{new Date(a.timestamp).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className="text-xs text-white/40">{new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#C89B3C]" /> Derniers paiements</h3>
            </div>
            {memberPayments.length === 0 ? (
              <div className="text-center py-6 text-sm text-white/40">Aucun paiement enregistré</div>
            ) : (
              <div className="divide-y divide-white/10">
                {memberPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-white/70">{p.amount.toLocaleString()} DZD</p>
                      <p className="text-[10px] text-white/40">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      p.status === "completed" ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    )}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.push("/coach/programs")} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
            <Dumbbell className="w-4 h-4" /> Créer programme
          </button>
          <button onClick={() => router.push("/coach/nutrition")} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
            <Apple className="w-4 h-4" /> Plan nutrition
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
            Mes Clients
          </h1>
          <p className="text-sm text-white/50 mt-1">Gérez vos adhérents et suivez leur progression</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <Users className="w-4 h-4 text-[#C89B3C]" />
            <span className="text-sm font-bold text-white">{members.length}</span>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou téléphone..."
            className="w-full pl-11 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "date" | "progress")}
            className="appearance-none pl-11 pr-10 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all min-w-[140px] cursor-pointer"
          >
            <option value="name" className="bg-gray-900 text-white">Nom</option>
            <option value="date" className="bg-gray-900 text-white">Date d&apos;ajout</option>
            <option value="progress" className="bg-gray-900 text-white">Progression</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all" as const, label: "Tous", count: members.length },
          { key: "active" as const, label: "Actifs", count: members.filter((m) => m.status === "active").length },
          { key: "expired" as const, label: "En attente", count: members.filter((m) => m.status === "expired" || m.status === "inactive").length },
          { key: "new" as const, label: "Nouveaux", count: members.filter((m) => new Date(m.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              filter === f.key
                ? "bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black border-transparent shadow-lg shadow-[#C89B3C]/20"
                : "bg-white/5 backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:border-[#C89B3C]/30"
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Users className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-lg font-bold text-white mb-1">Aucun client pour le moment</p>
          <p className="text-sm text-white/40">
            {search || filter !== "all"
              ? "Essayez de modifier vos filtres de recherche"
              : "Les clients qui vous seront assignés apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((m) => {
            const name = `${m.profile.firstName} ${m.profile.lastName}`
            const progress = calcProgress(m)
            const status = getStatus(m)
            const expDate = m.activeMembership?.endDate
            const isExpiring = expDate && new Date(expDate).getTime() - Date.now() < 15 * 24 * 60 * 60 * 1000

            return (
              <div
                key={m.id}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-all cursor-pointer"
                onClick={() => loadMemberDetail(m)}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] opacity-60" />
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center text-sm font-bold text-black shrink-0">
                      {m.profile.avatarUrl ? (
                        <Image src={m.profile.avatarUrl} alt="" width={48} height={48} className="w-full h-full rounded-full object-cover" />
                      ) : name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{name}</p>
                      {m.profile.phone && (
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{m.profile.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); loadMemberDetail(m) }}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all"
                        title="Envoyer un message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {m.activeMembership && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        isExpiring
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-green-400 bg-green-500/10 border-green-500/20"
                      )}>
                        {m.activeMembership.planName}
                      </span>
                    )}
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", status.color)}>
                      {status.label}
                    </span>
                  </div>

                  {m.fitnessGoal && (
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
                      <p className="text-xs text-white/60 truncate">{m.fitnessGoal}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Progression</span>
                      <span className="text-white/60 font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {expDate
                        ? `Jusqu'au ${new Date(expDate).toLocaleDateString("fr-FR")}`
                        : "N/A"
                      }
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#C89B3C] transition-colors" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
