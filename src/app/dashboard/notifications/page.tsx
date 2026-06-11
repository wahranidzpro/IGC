"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { Bell, CreditCard, MessageSquare, Megaphone, Inbox } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"
import type { Notification } from "@/types"

const typeConfig = {
  abonnement: { icon: CreditCard, color: "#C89B3C", bg: "rgba(200,155,60,0.1)", label: "Abonnement" },
  coach: { icon: MessageSquare, color: "#0A84FF", bg: "rgba(10,132,255,0.1)", label: "Coach" },
  promo: { icon: Megaphone, color: "#A855F7", bg: "rgba(168,85,247,0.1)", label: "Promotions" },
  system: { icon: Bell, color: "#6B7280", bg: "rgba(255,255,255,0.05)", label: "Système" },
}

const tabs = ["TOUTES", "NON LUES", "IMPORTANTES"]

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()
    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("id").eq("profile_id", uid).maybeSingle()
        const memberId = (mData as { id?: string } | null)?.id
        if (!memberId) { setLoading(false); return }
        const { data: n } = await supabase.from("notifications").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(50)
        if (n) setNotifs(mapRows<Notification>(n as unknown as Record<string, unknown>[]))
      } catch (e) { logger.error('Notifications error', e) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const filtered = notifs.filter((n) => {
    if (activeTab === 0) return true
    if (activeTab === 1) return !n.isRead
    if (activeTab === 2) return n.type === "abonnement" || n.type === "system"
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
        <div className="p-4 space-y-4">
          <div className="h-6 w-40 rounded shimmer" />
          <div className="flex gap-2"><div className="h-8 w-24 rounded-full shimmer" /><div className="h-8 w-24 rounded-full shimmer" /><div className="h-8 w-28 rounded-full shimmer" /></div>
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
      <BackButton />
      <div className="px-4 pt-2 pb-2">
        <h1 className="text-lg font-bold text-white">Notifications</h1>
        <p className="text-xs text-gray-400 mt-0.5">{notifs.filter((n) => !n.isRead).length} non lues</p>
      </div>

      <div className="px-4 mt-4">
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {tabs.map((t, i) => {
            const count = i === 0 ? notifs.length : i === 1 ? notifs.filter((n) => !n.isRead).length : notifs.filter((n) => n.type === "abonnement" || n.type === "system").length
            return (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className="flex-1 py-2.5 text-xs font-bold transition-all duration-200 relative"
                style={{
                  background: activeTab === i ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.03)",
                  color: activeTab === i ? "#0A84FF" : "rgba(255,255,255,0.4)",
                }}
              >
                {t}
                {count > 0 && (
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: activeTab === i ? "#0A84FF" : "rgba(255,255,255,0.1)", color: "white" }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-2 pb-28">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Inbox className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Aucune notification</p>
            <p className="text-xs text-gray-400">Vous êtes à jour</p>
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = typeConfig[n.type]
            return (
              <div
                key={n.id}
                className="rounded-2xl p-4 flex items-start gap-3 transition-all border"
                style={{
                  background: !n.isRead ? "rgba(10,132,255,0.05)" : "rgba(255,255,255,0.03)",
                  borderColor: !n.isRead ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.06)",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                  <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${!n.isRead ? "font-bold text-white" : "text-gray-300"}`}>{n.title}</p>
                    <span className="text-[10px] text-gray-500 shrink-0">{relativeTime(n.createdAt)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 line-clamp-2 ${!n.isRead ? "text-gray-300" : "text-gray-400"}`}>{n.description}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "#0A84FF" }} />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
