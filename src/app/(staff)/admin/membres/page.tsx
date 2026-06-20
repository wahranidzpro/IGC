"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Search, UserCheck, Mail, Phone, Calendar, Users } from "lucide-react"
import PaginationControls from "@/components/ui/PaginationControls"
import { StatusBadge } from "@/components/auth/SubscriptionStatus"

interface MemberRow {
  id: string
  profileId: string
  status: string
  createdAt: string
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
  membership: {
    planName: string
    endDate: string
    status: string
  } | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  active: { label: "Actif", bg: "bg-[rgba(16,185,129,0.1)]", text: "text-[#10B981]", border: "border-[rgba(16,185,129,0.2)]", dot: "bg-[#10B981]" },
  inactive: { label: "Inactif", bg: "bg-[rgba(168,178,199,0.08)]", text: "text-[#A8B2C7]", border: "border-[rgba(168,178,199,0.15)]", dot: "bg-[#A8B2C7]" },
  suspended: { label: "Suspendu", bg: "bg-[rgba(255,77,77,0.1)]", text: "text-[#FF4D4D]", border: "border-[rgba(255,77,77,0.2)]", dot: "bg-[#FF4D4D]" },
  expired: { label: "Expir\u00e9", bg: "bg-[rgba(200,155,60,0.1)]", text: "text-[#C89B3C]", border: "border-[rgba(200,155,60,0.2)]", dot: "bg-[#C89B3C]" },
}

export default function AdminMembresPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("members")
        .select("*, profile:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(50)
      if (data) {
        const enriched: MemberRow[] = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapRows<any>(data).map(async (m: Record<string, any>) => {
            const { data: ms } = await supabase
              .from("memberships")
              .select("plan_name, end_date, status")
              .eq("member_id", m.id)
              .eq("status", "active")
              .maybeSingle()
            const membership = mapRow<{ planName: string; endDate: string; status: string }>(ms)
            return { ...m, membership } as MemberRow
          })
        )
        setMembers(enriched)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = members
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => {
        const p = m.profile
        return (
          p?.firstName.toLowerCase().includes(q) ||
          p?.lastName.toLowerCase().includes(q) ||
          p?.email.toLowerCase().includes(q) ||
          p?.phone?.includes(q)
        )
      })
    }
    if (statusFilter !== "all") list = list.filter((m) => m.status === statusFilter)
    return list
  }, [members, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => { setTimeout(() => setCurrentPage(1)) }, [search, statusFilter])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#0A84FF]/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">MEMBRES</h1>
          </div>
          <p className="text-[#A8B2C7] text-sm ml-[52px]">{members.length} membres inscrits</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-48 lg:w-60 h-10 pl-10 pr-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 focus:shadow-[0_0_15px_rgba(10,132,255,0.1)] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-[rgba(255,255,255,0.06)]">
          <Users className="w-12 h-12 text-[#A8B2C7]/30 mx-auto mb-3" />
          <p className="text-[#A8B2C7]">Aucun membre trouv\u00e9</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A8B2C7] border-b border-[rgba(255,255,255,0.06)]">
              <div className="col-span-4">Membre</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Abonnement</div>
              <div className="col-span-1 text-center">Statut</div>
              <div className="col-span-2 text-right">Expiration</div>
            </div>

            {paginated.map((m) => {
              return (
                <div key={m.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF]/20 to-[#00D4FF]/10 flex items-center justify-center shrink-0 border border-[rgba(10,132,255,0.15)]">
                        <UserCheck className="w-5 h-5 text-[#0A84FF]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {m.profile?.firstName} {m.profile?.lastName}
                        </p>
                        <p className="text-[#A8B2C7] text-xs">ID: {m.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-[#A8B2C7] space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{m.profile?.email}</span>
                      </div>
                      {m.profile?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{m.profile.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-semibold text-white">
                        {m.membership?.planName || "—"}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="col-span-2 text-right text-sm text-[#A8B2C7]">
                      {m.membership ? (
                        <span className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(m.membership.endDate).toLocaleDateString("fr-FR")}
                        </span>
                      ) : "—"}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  )
}
