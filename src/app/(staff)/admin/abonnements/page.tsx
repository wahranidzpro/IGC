"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRows } from "@/lib/utils/transform"
import AdminStatsCard from "@/components/admin/AdminStatsCard"
import { Receipt, UserCheck, Calendar, DollarSign, TrendingUp, CreditCard, Search, RefreshCw } from "lucide-react"
import PaginationControls from "@/components/ui/PaginationControls"

interface MembershipRow {
  id: string
  planName: string
  type: string
  startDate: string
  endDate: string
  sessionsTotal: number | null
  sessionsUsed: number
  amount: number
  status: string
  autoRenew: boolean
  member: {
    profile: { firstName: string; lastName: string } | null
  } | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  active: { label: "Actif", bg: "bg-[rgba(16,185,129,0.1)]", text: "text-[#10B981]", border: "border-[rgba(16,185,129,0.2)]", dot: "bg-[#10B981]" },
  expired: { label: "Expir\u00e9", bg: "bg-[rgba(200,155,60,0.1)]", text: "text-[#C89B3C]", border: "border-[rgba(200,155,60,0.2)]", dot: "bg-[#C89B3C]" },
  cancelled: { label: "Annul\u00e9", bg: "bg-[rgba(255,77,77,0.1)]", text: "text-[#FF4D4D]", border: "border-[rgba(255,77,77,0.2)]", dot: "bg-[#FF4D4D]" },
  pending: { label: "En attente", bg: "bg-[rgba(168,178,199,0.08)]", text: "text-[#A8B2C7]", border: "border-[rgba(168,178,199,0.15)]", dot: "bg-[#A8B2C7]" },
}

export default function AdminAbonnementsPage() {
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("memberships")
        .select("*, member:members(profile:profiles(*))")
        .order("end_date", { ascending: true })
        .limit(50)
      if (data) setMemberships(mapRows<MembershipRow>(data))
      setLoading(false)
    }
    load()
  }, [])

  const activeCount = useMemo(() => memberships.filter(m => m.status === "active").length, [memberships])
  const monthlyRevenue = useMemo(() =>
    memberships.filter(m => m.status === "active").reduce((s, m) => s + m.amount, 0),
    [memberships]
  )
  const autoRenewCount = useMemo(() => memberships.filter(m => m.autoRenew).length, [memberships])

  const filtered = useMemo(() => {
    let list = memberships
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.planName.toLowerCase().includes(q) ||
        `${m.member?.profile?.firstName} ${m.member?.profile?.lastName}`.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") list = list.filter(m => m.status === statusFilter)
    return list
  }, [memberships, search, statusFilter])

  useEffect(() => { setTimeout(() => setPage(1)) }, [search, statusFilter])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="h-80 rounded-2xl shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center shadow-lg shadow-[#C89B3C]/30">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">ABONNEMENTS</h1>
          </div>
          <p className="text-[#A8B2C7] text-sm ml-[52px]">{memberships.length} abonnements</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-48 lg:w-60 h-10 pl-10 pr-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#C89B3C]/50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none transition-all"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard label="Abonnements Actifs" value={activeCount} icon={CreditCard} color="green" />
        <AdminStatsCard label="Revenus Mensuels" value={`${monthlyRevenue.toLocaleString()} DA`} icon={TrendingUp} color="gold" />
        <AdminStatsCard label="Renouvellement Auto" value={autoRenewCount} icon={RefreshCw} color="blue" />
        <AdminStatsCard label="Revenu Moyen" value={memberships.length > 0 ? `${Math.round(monthlyRevenue / memberships.length).toLocaleString()} DA` : "—"} icon={DollarSign} color="turquoise" />
      </div>

      {/* Subscriptions List */}
      <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-[#A8B2C7]/30 mx-auto mb-3" />
            <p className="text-[#A8B2C7]">Aucun abonnement trouv\u00e9</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A8B2C7] border-b border-[rgba(255,255,255,0.06)]">
              <div className="col-span-3">Membre</div>
              <div className="col-span-2">Forfait</div>
              <div className="col-span-2">P\u00e9riode</div>
              <div className="col-span-1 text-center">S\u00e9ances</div>
              <div className="col-span-1 text-center">Statut</div>
              <div className="col-span-1 text-center">Auto</div>
              <div className="col-span-2 text-right">Montant</div>
            </div>

            {paginated.map((ms) => {
              const st = STATUS_STYLES[ms.status] || STATUS_STYLES.pending
              return (
                <div key={ms.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C89B3C]/20 to-[#E0B85D]/10 flex items-center justify-center shrink-0 border border-[rgba(200,155,60,0.15)]">
                      <UserCheck className="w-5 h-5 text-[#C89B3C]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {ms.member?.profile?.firstName} {ms.member?.profile?.lastName}
                      </p>
                      <p className="text-[#A8B2C7] text-xs">{ms.type}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold text-white">{ms.planName}</span>
                  </div>
                  <div className="col-span-2 text-xs text-[#A8B2C7]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ms.startDate).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(ms.endDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="col-span-1 text-center text-sm text-[#A8B2C7]">
                    {ms.sessionsTotal ? `${ms.sessionsUsed}/${ms.sessionsTotal}` : "—"}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    {ms.autoRenew ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                        Oui
                      </span>
                    ) : (
                      <span className="text-[#A8B2C7] text-xs">Non</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-white">{ms.amount.toLocaleString()} DA</span>
                  </div>
                </div>
              )
            })}
            <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
