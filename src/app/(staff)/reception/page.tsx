"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import AdminStatsCard from "@/components/admin/AdminStatsCard"
import {
  Users, DoorOpen, CreditCard, UserPlus, QrCode,
  Wallet, Gift, Search, Clock, ArrowRight,
  CheckCircle2, XCircle, Loader2, X, TrendingUp,
  Dumbbell, Zap, Coffee,
} from "lucide-react"
import MemberTable from "@/components/dashboard/MemberTable"
import Link from "next/link"
import ScreenSaver from "@/components/ui/ScreenSaver"

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function getInitial(name: string): string {
  return (name || "?").charAt(0).toUpperCase()
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return "\u00c0 l'instant"
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
  return formatTime(d)
}

const QUICK_ACTIONS = [
  { label: "Scanner QR", desc: "Pointage entr\u00e9e/sortie", href: "/checkin", icon: QrCode, from: "#0A84FF", to: "#00D4FF" },
  { label: "Encaissement", desc: "Paiement abonnement", href: "/payments", icon: Wallet, from: "#10B981", to: "#34D399" },
  { label: "Badge / Fid\u00e9lit\u00e9", desc: "Points et r\u00e9compenses", href: "/fidelity", icon: Gift, from: "#C89B3C", to: "#E0B85D" },
]

export default function ReceptionPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [now, setNow] = useState(new Date())
  const [stats, setStats] = useState<{
    todayPresences: number
    todayNewMembers: number
    activeMembers: number
    todayPayments: number
    todayPaymentTotal: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [checkins, setCheckins] = useState<{
    id: string
    memberName: string
    timestamp: string
    type: string
  }[]>([])
  const [checkinsLoading, setCheckinsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    id: string
    firstName: string
    lastName: string
    phone: string | null
  }[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [memberTableData, setMemberTableData] = useState<{
    members: any[]
    payments: any[]
    programs: any[]
    coaches: any[]
  }>({ members: [], payments: [], programs: [], coaches: [] })
  const [membersLoading, setMembersLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayISO = todayStart.toISOString()

      const [presencesRes, newMembersRes, activeRes, paymentsRes] = await Promise.all([
        supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", todayISO),
        supabase
          .from("members")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayISO),
        supabase
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("payments")
          .select("amount")
          .gte("paid_at", todayISO),
      ])

      const paymentTotal =
        (paymentsRes.data as { amount: number }[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      setStats({
        todayPresences: presencesRes.count ?? 0,
        todayNewMembers: newMembersRes.count ?? 0,
        activeMembers: activeRes.count ?? 0,
        todayPayments: paymentsRes.data?.length ?? 0,
        todayPaymentTotal: paymentTotal,
      })
    } catch {
      setStats(null)
    }
    setStatsLoading(false)
  }, [supabase])

  const fetchCheckins = useCallback(async () => {
    setCheckinsLoading(true)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from("attendance")
        .select(`
          id,
          type,
          timestamp,
          member:members (
            id,
            profiles!inner (
              first_name,
              last_name
            )
          )
        `)
        .gte("timestamp", todayStart.toISOString())
        .order("timestamp", { ascending: false })
        .limit(10)

      setCheckins(
        mapRows<any>(data).map((c: any) => {
          const profile = c.member?.profiles
          const name = profile
            ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
            : "Inconnu"
          return { id: c.id, memberName: name, timestamp: c.timestamp, type: c.type }
        })
      )
    } catch {
      setCheckins([])
    }
    setCheckinsLoading(false)
  }, [supabase])

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const { data: membersData } = await supabase
        .from("members")
        .select(`
          id,
          status,
          subscription_type,
          sessions_left,
          amount_paid,
          balance_due,
          program_id,
          coach_id,
          created_at,
          updated_at,
          profile:profiles (
            first_name,
            last_name,
            phone
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      const members = mapRows<any>(membersData).map((m: any) => ({
        id: m.id,
        firstName: m.profile?.firstName || '',
        lastName: m.profile?.lastName || '',
        phone: m.profile?.phone || '',
        status: m.status,
        subscriptionType: m.subscriptionType || 'subscription',
        sessionsLeft: m.sessionsLeft,
        amountPaid: m.amountPaid,
        balanceDue: m.balanceDue,
        programId: m.programId,
        coachId: m.coachId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }))

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .order("paid_at", { ascending: false })
        .limit(50)

      const { data: coachesData } = await supabase
        .from("coaches")
        .select(`id, profile:profiles (first_name, last_name)`)
        .limit(50)

      const coaches = mapRows<any>(coachesData).map((c: any) => ({
        id: c.id,
        name: `${c.profile?.firstName || ''} ${c.profile?.lastName || ''}`.trim() || 'Coach',
      }))

      setMemberTableData({
        members,
        payments: mapRows<any>(paymentsData) || [],
        programs: [],
        coaches,
      })
    } catch {
      setMemberTableData({ members: [], payments: [], programs: [], coaches: [] })
    }
    setMembersLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()
    fetchCheckins()
    fetchMembers()
  }, [fetchStats, fetchCheckins, fetchMembers])

  const handleSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }
      setSearching(true)
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, phone")
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(8)

        setSearchResults(mapRows<any>(data))
        setShowResults(true)
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    },
    [supabase]
  )

  const onSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => handleSearch(value), 300)
  }

  const userName =
    user && "name" in user
      ? (user as any).name
      : user?.email?.split("@")[0] || "\u00e0 la r\u00e9ception"

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-3xl glass border border-[rgba(255,255,255,0.06)] p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 via-transparent to-[#7C3AED]/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A84FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-bold tracking-wide border border-[#0A84FF]/20">
                  <Clock className="w-3 h-3" /> R\u00e9ception
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-bold tracking-wide border border-[#10B981]/20">
                  <Zap className="w-3 h-3" /> En ligne
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Bonjour, {userName}
              </h1>
              <p className="text-[#A8B2C7] text-sm mt-1">
                {formatDate(now)} — <span className="text-[#0A84FF] font-semibold">{formatTime(now)}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { fetchStats(); fetchCheckins(); }}
                className="px-5 py-2.5 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)]"
              >
                <Loader2 className="w-4 h-4" /> Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          label="Pr\u00e9sences aujourd'hui"
          value={stats?.todayPresences ?? 0}
          icon={DoorOpen}
          color="blue"
        />
        <AdminStatsCard
          label="Nouveaux aujourd'hui"
          value={stats?.todayNewMembers ?? 0}
          icon={TrendingUp}
          color="green"
        />
        <AdminStatsCard
          label="Adh\u00e9rents actifs"
          value={stats?.activeMembers ?? 0}
          icon={Users}
          color="gold"
        />
        <AdminStatsCard
          label="Paiements du jour"
          value={stats ? `${stats.todayPayments} - ${stats.todayPaymentTotal.toLocaleString()} DA` : "..."}
          icon={CreditCard}
          color="turquoise"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group relative overflow-hidden glass rounded-2xl p-5 border border-[rgba(255,255,255,0.06)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-[${a.from}] to-[${a.to}] flex items-center justify-center mb-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-bold text-sm">{a.label}</p>
                <p className="text-[#A8B2C7] text-xs mt-0.5">{a.desc}</p>
              </div>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent check-ins */}
        <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-white font-bold flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#0A84FF]" />
            </div>
            Derni\u00e8res pr\u00e9sences
          </h3>

          {checkinsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-[rgba(255,255,255,0.04)] rounded w-1/2" />
                    <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <div className="text-center py-10">
              <DoorOpen className="w-10 h-10 text-[#A8B2C7]/30 mx-auto mb-3" />
              <p className="text-[#A8B2C7] text-sm">Aucune pr\u00e9sence enregistr\u00e9e aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-1">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF]/20 to-[#00D4FF]/10 flex items-center justify-center text-[#0A84FF] font-black text-sm shrink-0 border border-[rgba(10,132,255,0.15)]">
                    {getInitial(c.memberName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {c.memberName}
                    </p>
                    <p className="text-[#A8B2C7] text-xs">
                      {formatTimestamp(c.timestamp)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider ${
                      c.type === "entry"
                        ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                        : "bg-[rgba(168,178,199,0.08)] text-[#A8B2C7] border border-[rgba(168,178,199,0.15)]"
                    }`}
                  >
                    {c.type === "entry" ? (
                      <><CheckCircle2 className="w-3 h-3" /> ENTR\u00c9E</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> SORTIE</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick member search */}
        <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] relative" ref={resultsRef}>
          <h3 className="text-white font-bold flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-[#0A84FF]" />
            </div>
            Rechercher un adh\u00e9rent
          </h3>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Nom, pr\u00e9nom ou t\u00e9l\u00e9phone..."
              className="w-full h-12 pl-11 pr-11 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 focus:shadow-[0_0_15px_rgba(10,132,255,0.1)] transition-all"
            />
            {searching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7] animate-spin pointer-events-none" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults([])
                  setShowResults(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8B2C7] hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {showResults && (
            <div className="absolute z-20 left-6 right-6 mt-3 glass-strong rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden animate-scale-in">
              {searchResults.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#A8B2C7] text-sm">
                  Aucun adh\u00e9rent trouv\u00e9
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((m) => (
                    <Link
                      key={m.id}
                      href={`/members/profile/${m.id}`}
                      onClick={() => {
                        setShowResults(false)
                        setSearchQuery("")
                      }}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors group border-b border-[rgba(255,255,255,0.04)] last:border-0"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF]/20 to-[#00D4FF]/10 flex items-center justify-center text-[#0A84FF] font-black text-sm shrink-0 border border-[rgba(10,132,255,0.15)]">
                        {getInitial(m.firstName || m.lastName || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {m.firstName} {m.lastName}
                        </p>
                        {m.phone && (
                          <p className="text-[#A8B2C7] text-xs truncate">{m.phone}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#A8B2C7] group-hover:text-[#0A84FF] transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!showResults && searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-4 text-center text-[#A8B2C7] text-xs">
              Saisissez au moins 2 caract\u00e8res
            </p>
          )}
        </div>
      </div>

      {/* Recent members */}
      <div>
        {membersLoading ? (
          <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 animate-pulse" />
              <div className="h-5 w-56 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
              <div className="ml-auto h-4 w-16 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.04)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-[rgba(255,255,255,0.04)] rounded w-1/3" />
                    <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MemberTable
            members={memberTableData.members}
            payments={memberTableData.payments}
            programs={memberTableData.programs}
            coaches={memberTableData.coaches}
          />
        )}
      </div>

      <ScreenSaver />
    </div>
  )
}
