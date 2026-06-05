"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"
import { MessageSquare, Search, Send, ChevronRight, AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

interface Conversation {
  id: number
  name: string
  role: string
  avatar: string
  last: string
  time: string
  unread: number
  online: boolean
}

const sampleConversations: Conversation[] = [
  {
    id: 1,
    name: "Karim Mansouri",
    role: "Coach",
    avatar: "/images/coach-mohamed.jpg",
    last: "Super séance aujourd'hui ! Continue comme ça 💪",
    time: "14:25",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Infinity Gym Center",
    role: "Support",
    avatar: "/logo-transparent.png",
    last: "Votre abonnement sera renouvelé le 01/06",
    time: "Hier",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Amina Cherif",
    role: "Membre",
    avatar: "/images/avatar-2.jpg",
    last: "On se retrouve à 18h pour le crossfit ?",
    time: "Hier",
    unread: 0,
    online: false,
  },
  {
    id: 4,
    name: "Dr. Merabet",
    role: "Nutritionniste",
    avatar: "/images/avatar-3.jpg",
    last: "N'oubliez pas de boire 2L d'eau par jour",
    time: "Mar 12",
    unread: 1,
    online: true,
  },
]

export default function MessagesPage() {
  const [search, setSearch] = useState("")
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setConversations(sampleConversations)
        setError(null)
      } catch {
        setError("Impossible de charger les messages")
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedChat,
          content: message.trim(),
        }),
      })
      if (!res.ok) throw new Error("Erreur envoi")
      setMessage("")
    } catch {
      logger.error('Erreur envoi message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-white/10 rounded-lg shimmer" />
        <div className="h-10 bg-white/10 rounded-xl shimmer" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/10 rounded-xl shimmer" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  const filtered = (conversations || []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = selectedChat ? conversations?.find((c) => c.id === selectedChat) : null

  if (selectedConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-white">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10">
            <Image src={selectedConv.avatar} alt="" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{selectedConv.name}</p>
            <p className="text-[10px] text-green-400">{selectedConv.online ? "En ligne" : "Hors ligne"}</p>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
              <p className="text-sm text-gray-200">{selectedConv.last}</p>
              <p className="text-[10px] text-gray-400 mt-1">{selectedConv.time}</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2.5 bg-white/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 text-white placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-10 h-10 rounded-xl bg-brand-red text-white flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucune conversation</p>
          <p className="text-sm text-gray-400">Vous n&apos;avez pas encore de messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Messages</h1>
        <p className="text-sm text-gray-400 mt-0.5">Discutez avec votre coach et le support</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 text-white placeholder-gray-500"
        />
      </div>

      <div className="space-y-1">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setSelectedChat(conv.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                <Image src={conv.avatar} alt="" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              {conv.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{conv.name}</p>
                <p className="text-[10px] text-gray-400">{conv.time}</p>
              </div>
              <p className="text-xs text-gray-400 truncate">{conv.last}</p>
            </div>
            {conv.unread > 0 && (
              <span className="bg-brand-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {conv.unread}
              </span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <MessageSquare className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucune conversation trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
