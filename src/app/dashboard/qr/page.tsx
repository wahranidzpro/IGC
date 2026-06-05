"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import { checkActiveDevice, isMobileDevice } from "@/lib/device"
import {
  ShieldAlert, Clock, RefreshCw, Wifi, CircleCheck, Smartphone,
  Monitor, Lock, Eye,
} from "lucide-react"
import type { Membership } from "@/types"

const REFRESH_INTERVAL = 5000

export default function MemberQRPage() {
  const { user, role } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [clock, setClock] = useState("")
  const [membership, setMembership] = useState<Membership | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [deviceChecked, setDeviceChecked] = useState(false)
  const [deviceBlocked, setDeviceBlocked] = useState(false)
  const [deviceBlockReason, setDeviceBlockReason] = useState("")

  const [isHidden, setIsHidden] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()
    async function load() {
      const { data: m } = await supabase.from("members").select("*").eq("profile_id", uid).maybeSingle()
      const memberId = mapRow<{ id?: string }>(m as unknown as Record<string, unknown> | null)?.id
      if (memberId) {
        const { data: ms } = await supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberId)
          .eq("status", "active")
          .maybeSingle()
        if (ms) setMembership(mapRow<Membership>(ms as unknown as Record<string, unknown> | null) as Membership)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    async function verify() {
      const result = await checkActiveDevice()
      setDeviceChecked(true)
      if (!result.allowed) {
        setDeviceBlocked(true)
        setDeviceBlockReason(result.reason || "APPAREIL_NON_AUTORISE")
      }
    }
    verify()
  }, [])

  useEffect(() => {
    const onBlur = () => setIsHidden(true)
    const onFocus = () => setIsHidden(false)
    const onVisibility = () => {
      if (document.hidden) setIsHidden(true)
      else setIsHidden(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p")) {
        setIsHidden(true)
        setTimeout(() => setIsHidden(false), 2000)
      }
    }
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

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

  if (role !== "adherent") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="text-xl font-bold text-white">Accès réservé aux membres</h1>
          <p className="text-sm text-gray-400">Cette page est uniquement accessible aux membres.</p>
        </div>
      </div>
    )
  }

  if (!deviceChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Vérification de l&apos;appareil...</span>
        </div>
      </div>
    )
  }

  if (deviceBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Appareil non autorisé</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Un autre appareil est déjà connecté à votre compte.
            Pour des raisons de sécurité, un seul appareil peut afficher le QR à la fois.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left text-sm">
            <p className="text-amber-400 font-medium mb-1">Appareil actif détecté</p>
            <p className="text-amber-300 text-xs">{deviceBlockReason}</p>
          </div>
          <button
            onClick={async () => {
              const res = await fetch("/api/device/transfer/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId: user?.id }),
              })
              const data = await res.json()
              if (data.success) {
                window.location.href = `/login?migrate=${user?.id}`
              }
            }}
            className="w-full bg-brand-red text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Migrer vers cet appareil
          </button>
        </div>
      </div>
    )
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="text-xl font-bold text-white">Application mobile requise</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Le QR code d&apos;accès est uniquement disponible sur l&apos;application mobile
            Infinity Gym Center.
          </p>
          <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3 text-left">
              <Monitor className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Vous êtes sur un ordinateur</p>
                <p className="text-xs text-gray-400">Ouvrez l&apos;app sur votre téléphone pour accéder au QR</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <QrCodeIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">QR code dynamique</p>
                <p className="text-xs text-gray-400">Disponible uniquement sur mobile pour votre sécurité</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Sécurisé</p>
                <p className="text-xs text-gray-400">Anti-capture d&apos;écran et rotation automatique</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Téléchargez l&apos;app depuis le Play Store ou l&apos;App Store</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold tabular-nums">{clock}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${membership ? "bg-green-500 animate-pulse" : "bg-white/20"}`} />
            <span className="text-xs text-gray-400 font-medium">
              {membership ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-bold text-white">Mon QR d&apos;accès</h1>
          <p className="text-xs text-gray-400 mt-0.5">Présentez au tourniquet</p>
        </div>

        <div className="relative" onContextMenu={(e) => e.preventDefault()}>
          <div className={`glass rounded-3xl p-6 shadow-xl transition-all duration-400 ${
            isRefreshing ? "scale-95 opacity-50" : "scale-100 opacity-100"
          } ${isHidden ? "ring-4 ring-red-300" : "border-white/10"}`}>
            <div className={`transition-all duration-400 ${
              isRefreshing || isHidden ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100 blur-none"
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
                  <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
              )}
            </div>
            {isHidden && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-sm">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-500">QR masqué</p>
                  <p className="text-xs text-gray-400">Revenez sur l&apos;app pour révéler</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-[236px] space-y-2">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
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
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-white/5 text-gray-400 border border-white/10"
        }`}>
          <CircleCheck className="w-3.5 h-3.5" />
          {membership
            ? `${membership.planName} · Expire le ${new Date(membership.endDate).toLocaleDateString("fr-FR")}`
            : "Aucun abonnement actif"}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
          <Lock className="w-3 h-3" />
          Protection anti-capture activée
        </div>

        <p className="text-[10px] text-gray-400 text-center max-w-xs leading-relaxed">
          QR dynamique renouvelé toutes les 5 secondes.
          Il se masque automatiquement si vous quittez l&apos;app.
        </p>
      </div>
    </div>
  )
}

function QrCodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="5" />
      <rect x="16" y="3" width="5" height="5" />
      <rect x="3" y="16" width="5" height="5" />
      <path d="M21 16h-3v3" />
      <path d="M16 21v-5h5" />
    </svg>
  )
}