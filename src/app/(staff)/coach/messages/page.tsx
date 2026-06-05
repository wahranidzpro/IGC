"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import {
  MessageSquare, Search, Send, ChevronRight, AlertCircle, RefreshCw, Users,
} from "lucide-react"
import type { Message, Profile, Member } from "@/types"

interface ConversationMember {
  id: string
  name: string
  avatar: string | null
  lastMessage: string
  lastTime: string
  unread: number
}

export default function CoachMessagesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: cData } = await supabase.from("coaches").select("*").eq("profile_id", uid).maybeSingle()
        const cId = mapRow<{ id: string }>(cData as Record<string, unknown> | null)?.id
        if (!cId) { setLoading(false); return }
        setCoachId(cId)

        const { data: mcData } = await supabase
          .from("member_coaches")
          .select("member_id")
          .eq("coach_id", cId)
          .eq("is_active", true)
        const memberIds = mapRows<{ memberId: string }>(mcData as Record<string, unknown>[]).map((m) => m.memberId)

        if (memberIds.length === 0) { setLoading(false); return }

        const [{ data: mData }, { data: pData }] = await Promise.all([
          supabase.from("members").select("id, profile_id").in("id", memberIds),
          supabase.from("profiles").select("id, first_name, last_name, avatar_url"),
        ])

        const profiles = mapRows<Profile>(pData as Record<string, unknown>[]).reduce((acc, p) => {
          acc[p.id] = p; return acc
        }, {} as Record<string, Profile>)

        const convs: ConversationMember[] = mapRows<{ id: string; profileId: string }>(mData as Record<string, unknown>[]).map((m) => {
          const p = profiles[m.profileId]
          return {
            id: m.profileId,
            name: p ? `${p.firstName} ${p.lastName}` : "Inconnu",
            avatar: p?.avatarUrl || null,
            lastMessage: "",
            lastTime: "",
            unread: 0,
          }
        })

        const { data: msgData } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
          .order("created_at", { ascending: false })
          .limit(100)

        const allMsgs = mapRows<Message>(msgData as Record<string, unknown>[])
        for (const conv of convs) {
          const memberProfile = profiles[conv.id]
          if (!memberProfile) continue
          const memberProfileId = memberProfile.id
          const convMsgs = allMsgs.filter(
            (m) => (m.senderId === uid && m.receiverId === memberProfileId) ||
                   (m.senderId === memberProfileId && m.receiverId === uid)
          )
          if (convMsgs.length > 0) {
            conv.lastMessage = convMsgs[0].content
            conv.lastTime = convMsgs[0].createdAt
            conv.unread = convMsgs.filter((m) => m.receiverId === uid && !m.isRead).length
          }
        }

        setConversations(convs.sort((a, b) => new Date(b.lastTime || 0).getTime() - new Date(a.lastTime || 0).getTime()))
      } catch {
        setError("Impossible de charger les messages")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const openChat = async (memberId: string) => {
    setSelectedMember(memberId)
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()

    const memberProfile = conversations.find((c) => c.id === memberId)
    if (!memberProfile) return

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${uid})`)
      .order("created_at", { ascending: true })

    setMessages(mapRows<Message>(data as Record<string, unknown>[]))

    await supabase
      .from("messages")
      .update({ is_read: true } as never)
      .eq("receiver_id", uid)
      .eq("sender_id", memberId)
      .eq("is_read", false)

    setConversations((prev) => prev.map((c) => c.id === memberId ? { ...c, unread: 0 } : c))
  }

  const sendMessage = async () => {
    if (!user || !selectedMember || !newMessage.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedMember,
          content: newMessage.trim(),
        } as never)
        .select()
        .maybeSingle()

      if (err) throw err
      if (data) {
        setMessages((prev) => [...prev, mapRow<Message>(data as Record<string, unknown>)!])
        setNewMessage("")
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
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
          <p className="text-sm font-bold text-brand-black mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (selectedMember) {
    const conv = conversations.find((c) => c.id === selectedMember)
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="px-4 py-3 border-b flex items-center gap-3 bg-white">
          <button onClick={() => setSelectedMember(null)} className="text-gray-500 hover:text-brand-black">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold">
            {conv?.avatar ? <Image src={conv.avatar} alt="" width={36} height={36} className="w-full h-full rounded-full object-cover" /> : conv?.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-bold text-brand-black">{conv?.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun message. Envoyez un message à {conv?.name}.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMine = m.senderId === user?.id
              return (
                <div key={m.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    isMine ? "bg-brand-red text-white rounded-tr-sm" : "bg-white border rounded-tl-sm shadow-sm"
                  }`}>
                    <p className="text-sm">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
              className="w-10 h-10 rounded-xl bg-brand-red text-white flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">Discutez avec vos adhérents</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un adhérent..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucune conversation</p>
          <p className="text-xs text-gray-500">{search ? "Essayez un autre terme" : "Vous n'avez pas encore de messages avec vos adhérents."}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv) => (
            <button key={conv.id} onClick={() => openChat(conv.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-sm font-bold">
                  {conv.avatar ? <Image src={conv.avatar} alt="" width={48} height={48} className="w-full h-full rounded-full object-cover" /> : conv.name.charAt(0).toUpperCase()}
                </div>
                {conv.unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-red text-white text-[8px] font-bold rounded-full flex items-center justify-center">{conv.unread}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-brand-black">{conv.name}</p>
                  {conv.lastTime && <p className="text-[10px] text-gray-400">{new Date(conv.lastTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>}
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage || "Aucun message"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
