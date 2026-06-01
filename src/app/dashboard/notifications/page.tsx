"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import {
  Bell, CheckCheck, CreditCard, MessageSquare, Megaphone, Inbox,
} from "lucide-react"
import type { Notification } from "@/types"

const typeConfig = {
  abonnement: { icon: CreditCard, color: "bg-orange-50 text-orange-600", label: "Abonnement" },
  coach: { icon: MessageSquare, color: "bg-blue-50 text-blue-600", label: "Coach" },
  promo: { icon: Megaphone, color: "bg-purple-50 text-purple-600", label: "Promotions" },
  system: { icon: Bell, color: "bg-gray-50 text-gray-600", label: "Système" },
}

const filters = [
  { key: "all", label: "Tout", icon: Inbox },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
  { key: "coach", label: "Coach", icon: MessageSquare },
  { key: "promo", label: "Promotions", icon: Megaphone },
] as const

type FilterKey = (typeof filters)[number]["key"]

function groupByDate(notifs: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  for (const n of notifs) {
    const d = new Date(n.createdAt)
    let key: string
    if (d.toDateString() === today.toDateString()) key = "Aujourd'hui"
    else if (d.toDateString() === yesterday.toDateString()) key = "Hier"
    else if ((today.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000) key = "Cette semaine"
    else key = "Plus ancien"
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  }
  return groups
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user.id
    const supabase = createClient()

    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("id").eq("profileId", uid).maybeSingle()
        const memberId = (mData as { id?: string } | null)?.id
        if (!memberId) { setLoading(false); return }

        const { data: n, error: err } = await supabase
          .from("notifications")
          .select("*")
          .eq("memberId", memberId)
          .order("createdAt", { ascending: false })
          .limit(50)

        if (err) throw err
        setNotifs((n as unknown as Notification[]) || [])
      } catch (e) {
        setError("Impossible de charger les notifications")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = activeFilter === "all" ? notifs : notifs.filter((n) => n.type === activeFilter)
  const unreadCount = notifs.filter((n) => !n.isRead).length
  const grouped = groupByDate(filtered)

  const markAsRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await createClient().from("notifications").update({ isRead: true } as never).eq("id", id)
    } catch { /* ignore */ }
  }

  const markAllAsRead = async () => {
    if (!user) return
    setSaving(true)
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      const { data: mData } = await createClient().from("members").select("id").eq("profileId", user.id).maybeSingle()
      const memberId = (mData as { id?: string } | null)?.id
      if (memberId) {
        await createClient().from("notifications").update({ isRead: true } as never).eq("memberId", memberId).eq("isRead", false)
      }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Erreur</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-red bg-brand-red/5 px-3 py-1.5 rounded-full hover:bg-brand-red/10 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {saving ? "..." : "Tout marquer lu"}
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === f.key
                ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                : "bg-white border border-gray-200 text-gray-600 hover:border-brand-red/30"
            }`}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucune notification</p>
          <p className="text-xs text-gray-500">
            {activeFilter === "all" ? "Vous n'avez aucune notification pour le moment" : "Aucune notification dans cette catégorie"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{group}</p>
              <div className="space-y-1.5">
                {items.map((n) => {
                  const cfg = typeConfig[n.type]
                  return (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.isRead) markAsRead(n.id) }}
                      className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all cursor-pointer ${
                        !n.isRead
                          ? "border-brand-red/20 ring-1 ring-brand-red/10 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
                        <cfg.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className={`text-sm truncate ${!n.isRead ? "font-bold text-brand-black" : "text-gray-700"}`}>
                              {n.title}
                            </p>
                            {!n.isRead && <span className="w-2 h-2 bg-brand-red rounded-full shrink-0" />}
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${!n.isRead ? "text-gray-600" : "text-gray-500"}`}>
                          {n.description}
                        </p>
                        <span className="inline-block mt-1.5 text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
