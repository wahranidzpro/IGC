"use client"

import { useState } from "react"
import { Search, Eye, MessageCircle, ChevronRight } from "lucide-react"

interface ClientData {
  id: string | number
  photo?: string
  firstName: string
  lastName: string
  program?: string
  goal?: string
  progress?: number
  lastSession?: string
  status: "active" | "inactive" | "pending" | "new"
}

interface CoachClientTableProps {
  clients: ClientData[]
  onViewClient?: (id: string | number) => void
  onMessage?: (id: string | number) => void
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: {
    label: "Actif",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
  },
  inactive: {
    label: "Inactif",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
  },
  pending: {
    label: "En attente",
    color: "#EAB308",
    bg: "rgba(234,179,8,0.1)",
  },
  new: {
    label: "Nouveau",
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.1)",
  },
}

const filters = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "pending", label: "En attente" },
  { key: "new", label: "Nouveaux" },
] as const

export function CoachClientTable({ clients, onViewClient, onMessage }: CoachClientTableProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = clients.filter((c) => {
    const matchFilter =
      activeFilter === "all" || c.status === activeFilter
    const matchSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (c.program?.toLowerCase() || "").includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] backdrop-blur-xl overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeFilter === f.key
                    ? "bg-[#C89B3C] text-[#081120] shadow-[0_0_15px_rgba(200,155,60,0.3)]"
                    : "bg-[rgba(255,255,255,0.04)] text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:ml-auto w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(200,155,60,0.4)] pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm text-white placeholder-[rgba(168,178,199,0.4)] bg-[rgba(200,155,60,0.05)] border border-[rgba(200,155,60,0.1)] rounded-full outline-none transition-all duration-200 focus:border-[rgba(200,155,60,0.3)] focus:bg-[rgba(200,155,60,0.08)] focus:shadow-[0_0_20px_rgba(200,155,60,0.05)]"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Photo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Programme</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Objectif</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Progression</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Dernière séance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#A8B2C7] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#A8B2C7] py-12 text-sm">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((client, i) => {
                  const sc = statusConfig[client.status] || statusConfig.pending
                  return (
                    <tr
                      key={client.id}
                      className={`border-b border-[rgba(255,255,255,0.04)] transition-all duration-200 hover:bg-[rgba(200,155,60,0.04)] hover:shadow-[inset_0_0_20px_rgba(200,155,60,0.04)] ${
                        i % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.015)]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[rgba(200,155,60,0.1)] border border-[rgba(200,155,60,0.1)] flex items-center justify-center text-xs font-bold text-[#C89B3C] shrink-0">
                          {client.photo ? (
                            <img src={client.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            `${client.firstName[0]}${client.lastName[0]}`
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-white">
                          {client.firstName} {client.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A8B2C7]">{client.program || "-"}</td>
                      <td className="px-4 py-3 text-sm text-[#A8B2C7]">{client.goal || "-"}</td>
                      <td className="px-4 py-3">
                        {client.progress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${client.progress}%`,
                                  background: `linear-gradient(90deg, #C89B3C, #E0B85D)`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#C89B3C] w-8 text-right">
                              {client.progress}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#A8B2C7]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A8B2C7]">{client.lastSession || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border"
                          style={{
                            color: sc.color,
                            background: sc.bg,
                            borderColor: `${sc.color}33`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: sc.color, boxShadow: `0 0 6px ${sc.color}` }}
                          />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {onViewClient && (
                            <button
                              onClick={() => onViewClient(client.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-[rgba(168,178,199,0.5)] hover:text-[#C89B3C] hover:bg-[rgba(200,155,60,0.1)] transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onMessage && (
                            <button
                              onClick={() => onMessage(client.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-[rgba(168,178,199,0.5)] hover:text-[#0A84FF] hover:bg-[rgba(10,132,255,0.1)] transition-all duration-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-[#A8B2C7] py-12 text-sm">Aucun client trouvé</div>
          ) : (
            filtered.map((client) => {
              const sc = statusConfig[client.status] || statusConfig.pending
              return (
                <div
                  key={client.id}
                  className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.06)] transition-all duration-200 hover:border-[rgba(200,155,60,0.15)] hover:shadow-[0_0_20px_rgba(200,155,60,0.06)]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgba(200,155,60,0.1)] border border-[rgba(200,155,60,0.1)] flex items-center justify-center text-xs font-bold text-[#C89B3C] shrink-0">
                      {client.photo ? (
                        <img src={client.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        `${client.firstName[0]}${client.lastName[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-[#A8B2C7] truncate">{client.program || "-"}</p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border shrink-0"
                      style={{
                        color: sc.color,
                        background: sc.bg,
                        borderColor: `${sc.color}33`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: sc.color, boxShadow: `0 0 6px ${sc.color}` }}
                      />
                      {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#A8B2C7] mb-3">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[rgba(168,178,199,0.5)] mb-0.5">Objectif</span>
                      {client.goal || "-"}
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[rgba(168,178,199,0.5)] mb-0.5">Dernière séance</span>
                      {client.lastSession || "-"}
                    </div>
                  </div>
                  {client.progress !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${client.progress}%`,
                            background: "linear-gradient(90deg, #C89B3C, #E0B85D)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#C89B3C]">{client.progress}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                    {onViewClient && (
                      <button
                        onClick={() => onViewClient(client.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-[#A8B2C7] hover:text-[#C89B3C] hover:bg-[rgba(200,155,60,0.08)] transition-all duration-200 border border-[rgba(255,255,255,0.06)]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir
                      </button>
                    )}
                    {onMessage && (
                      <button
                        onClick={() => onMessage(client.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-[#A8B2C7] hover:text-[#0A84FF] hover:bg-[rgba(10,132,255,0.08)] transition-all duration-200 border border-[rgba(255,255,255,0.06)]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
