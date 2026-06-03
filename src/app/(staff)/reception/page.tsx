"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  Users, DoorOpen, CreditCard, UserPlus, QrCode,
  Wallet, Gift, Search, Clock, ArrowRight,
  CheckCircle2, XCircle, Loader2, X, TrendingUp,
} from "lucide-react"
import Link from "next/link"

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
  if (diff < 60000) return "À l'instant"
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
  return formatTime(d)
}

const QUICK_ACTIONS = [
  { label: "Scanner QR", desc: "Pointage entrée/sortie", href: "/checkin", icon: QrCode, gradient: "from-purple-600 to-purple-800" },
  { label: "Nouvel adhérent", desc: "Inscription", href: "/signup", icon: UserPlus, gradient: "from-brand-red to-red-800" },
  { label: "Encaissement", desc: "Paiement abonnement", href: "/payments", icon: Wallet, gradient: "from-brand-green to-emerald-800" },
  { label: "Badge / Fidélité", desc: "Points et récompenses", href: "/fidelity", icon: Gift, gradient: "from-brand-gold to-amber-800" },
]

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  color: string
  bgColor: string
}

function StatCard({ icon: Icon, label, value, sub, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-2/3" />
      <div className="h-8 bg-gray-800 rounded w-1/2" />
      <div className="h-3 bg-gray-800 rounded w-1/3" />
    </div>
  )
}

interface QuickActionProps {
  icon: React.ElementType
  label: string
  desc: string
  href: string
  gradient: string
}

function QuickAction({ icon: Icon, label, desc, href, gradient }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-700 transition-all"
    >
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
    </Link>
  )
}

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
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

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

  useEffect(() => {
    fetchStats()
    fetchCheckins()
  }, [fetchStats, fetchCheckins])

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
      : user?.email?.split("@")[0] || "à la réception"

  const statCards = stats
    ? [
        {
          icon: DoorOpen,
          label: "Présences aujourd'hui",
          value: stats.todayPresences.toString(),
          sub: `${stats.todayPresences} entrées`,
          color: "text-brand-blue",
          bgColor: "bg-brand-blue/10",
        },
        {
          icon: TrendingUp,
          label: "Nouveaux aujourd'hui",
          value: stats.todayNewMembers.toString(),
          sub: "nouveaux adhérents",
          color: "text-brand-green",
          bgColor: "bg-brand-green/10",
        },
        {
          icon: Users,
          label: "Adhérents actifs",
          value: stats.activeMembers.toString(),
          sub: "abonnements actifs",
          color: "text-brand-gold",
          bgColor: "bg-brand-gold/10",
        },
        {
          icon: CreditCard,
          label: "Paiements du jour",
          value: `${stats.todayPayments}`,
          sub: `${stats.todayPaymentTotal.toLocaleString()} DA`,
          color: "text-brand-accent",
          bgColor: "bg-brand-accent/10",
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-red/90 via-brand-red to-brand-black p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/logo-transparent.png')] bg-no-repeat bg-right-bottom bg-contain opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold tracking-wide backdrop-blur-sm border border-white/10">
                  <Clock className="w-3 h-3" /> Réception
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Bonjour, {userName}
              </h1>
              <p className="text-white/70 text-sm mt-1 capitalize">
                {formatDate(now)} — {formatTime(now)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <QuickAction key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent check-ins */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-red" />
            Dernières présences
          </h3>

          {checkinsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucune présence enregistrée aujourd'hui
            </div>
          ) : (
            <div className="space-y-1">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm shrink-0">
                    {getInitial(c.memberName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {c.memberName}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatTimestamp(c.timestamp)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.type === "entry"
                        ? "bg-green-500/10 text-green-400 border border-green-500/30"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {c.type === "entry" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> ENTRÉE
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> SORTIE
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick member search */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 relative" ref={resultsRef}>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-red" />
            Rechercher un adhérent
          </h3>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Nom, prénom ou téléphone..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-colors"
            />
            {searching ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin pointer-events-none" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults([])
                  setShowResults(false)
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {showResults && (
            <div className="absolute z-20 left-5 right-5 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  Aucun adhérent trouvé
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
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm shrink-0">
                        {getInitial(m.firstName || m.lastName || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {m.firstName} {m.lastName}
                        </p>
                        {m.phone && (
                          <p className="text-gray-500 text-xs truncate">{m.phone}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!showResults && searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-3 text-center text-gray-500 text-xs">
              Saisissez au moins 2 caractères
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
