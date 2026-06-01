"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { ShieldAlert, Clock, RefreshCw, Wifi, CircleCheck } from "lucide-react"
import type { Membership } from "@/types"

const REFRESH_INTERVAL = 5000

export default function MemberQRPage() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [clock, setClock] = useState("")
  const [membership, setMembership] = useState<Membership | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const uid = user.id
    const supabase = createClient()
    async function load() {
      const { data: m } = await supabase.from("members").select("*").eq("profileId", uid).maybeSingle()
      const memberId = (m as { id?: string } | null)?.id
      if (memberId) {
        const { data: ms } = await supabase
          .from("memberships")
          .select("*")
          .eq("memberId", memberId)
          .eq("status", "active")
          .maybeSingle()
        if (ms) setMembership(ms as unknown as Membership)
      }
    }
    load()
  }, [user])

  const generateToken = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      const res = await fetch("/api/qr/generate", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur"); return }
      setToken(data.token)
      setTimeLeft(REFRESH_INTERVAL / 1000)
      setTimeout(() => setIsRefreshing(false), 400)
    } catch {
      setError("Erreur réseau")
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    generateToken()
    const refresh = setInterval(generateToken, REFRESH_INTERVAL)
    const tick = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => { clearInterval(refresh); clearInterval(tick) }
  }, [generateToken])

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  const progress = (timeLeft / (REFRESH_INTERVAL / 1000)) * 100

  if (user?.role !== "member") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="text-xl font-bold text-brand-black">Accès réservé aux membres</h1>
          <p className="text-sm text-gray-500">Cette page est uniquement accessible aux membres.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-brand-black">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold tabular-nums">{clock}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${membership ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-xs text-gray-500 font-medium">
              {membership ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-bold text-brand-black">Mon QR d&apos;accès</h1>
          <p className="text-xs text-gray-500 mt-0.5">Présentez au tourniquet</p>
        </div>

        <div className="relative">
          <div className={`bg-white rounded-3xl p-6 shadow-xl border transition-all duration-400 ${
            isRefreshing
              ? "scale-95 opacity-50 rotate-y-180"
              : "scale-100 opacity-100"
          } ${error ? "border-red-200" : "border-gray-100"}`}>
            <div className={`transition-all duration-400 ${
              isRefreshing ? "opacity-0 scale-75" : "opacity-100 scale-100"
            }`}>
              {token ? (
                <QRCodeSVG
                  value={`IGC:${user?.id}:${token}`}
                  size={220}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#0B0B0B"
                  includeMargin
                />
              ) : (
                <div className="w-[236px] h-[236px] flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          )}
        </div>

        <div className="w-full max-w-[236px] space-y-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-red rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${timeLeft <= 1 ? "animate-spin text-brand-red" : ""}`} />
              {timeLeft > 0 ? `${timeLeft}s` : "Actualisation..."}
            </span>
            <span className="text-gray-400 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Temps réel
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
          membership
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-50 text-gray-500 border border-gray-200"
        }`}>
          <CircleCheck className="w-3.5 h-3.5" />
          {membership
            ? `Abonnement ${membership.planName} · Expire le ${new Date(membership.endDate).toLocaleDateString("fr-FR")}`
            : "Aucun abonnement actif"}
        </div>

        <p className="text-[10px] text-gray-400 text-center max-w-xs leading-relaxed">
          Ce QR est dynamique et change toutes les 5 secondes.
          Chaque code est à usage unique pour votre sécurité.
        </p>
      </div>
    </div>
  )
}
