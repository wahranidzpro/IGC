"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow } from "@/lib/utils/transform"
import { checkActiveDevice, isMobileDevice } from "@/lib/device"
import { PrivacyScreen } from "@capacitor/privacy-screen"
import {
  ShieldAlert, RefreshCw, Smartphone,
  Monitor, Lock, Eye, QrCode,
} from "lucide-react"
import type { Profile } from "@/types"

const REFRESH_INTERVAL = 6000

export default function MemberQRPage() {
  const { user, role } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [deviceChecked, setDeviceChecked] = useState(false)
  const [deviceBlocked, setDeviceBlocked] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deviceBlockReason, setDeviceBlockReason] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  const [isHidden, setIsHidden] = useState(false)
  const [isMobile] = useState(isMobileDevice())
  const [flashOverlay, setFlashOverlay] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const memberName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ""}`.trim()
    : user && "name" in user
      ? (user as { name: string }).name
      : "Membre"

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()
    async function load() {
      const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("id", uid).maybeSingle()
      if (p) setProfile(mapRow<Profile>(p))
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
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        setIsHidden(true)
        setTimeout(() => setIsHidden(false), 2000)
      }
    }
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("touchstart", onTouchStart, { passive: true })
    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("touchstart", onTouchStart)
    }
  }, [])

  useEffect(() => {
    try {
      PrivacyScreen.enable({
        android: { dimBackground: true },
        ios: { blurEffect: "dark" },
      })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const m = navigator.mediaDevices
      if (m?.getDisplayMedia) {
        const original = m.getDisplayMedia.bind(m)
        m.getDisplayMedia = function (opts?: DisplayMediaStreamOptions) {
          setIsHidden(true)
          setTimeout(() => setIsHidden(false), 5000)
          return original(opts)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (timeLeft <= 1 && !isHidden) {
      const t = setTimeout(() => setFlashOverlay(true), 100)
      const t2 = setTimeout(() => setFlashOverlay(false), 200)
      return () => { clearTimeout(t); clearTimeout(t2) }
    }
  }, [timeLeft, isHidden])

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
    const init = setTimeout(() => generateToken(), 0)
    const refresh = setInterval(generateToken, REFRESH_INTERVAL)
    const tick = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => { clearTimeout(init); clearInterval(refresh); clearInterval(tick) }
  }, [generateToken])

  const progress = (timeLeft / (REFRESH_INTERVAL / 1000)) * 100

  if (role !== "adherent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Accès réservé aux membres</h1>
          <p className="text-sm text-gray-400">Cette page est uniquement accessible aux membres.</p>
        </div>
      </div>
    )
  }

  if (!deviceChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
      >
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Vérification de l&apos;appareil...</span>
        </div>
      </div>
    )
  }

  if (deviceBlocked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
      >
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Appareil non autorisé</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Un autre appareil est déjà connecté à votre compte.
          </p>
          <button
            onClick={async () => {
              const res = await fetch("/api/device/transfer/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId: user?.id }),
              })
              const data = await res.json()
              if (data.success) window.location.href = `/login?migrate=${user?.id}`
            }}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Migrer vers cet appareil
          </button>
        </div>
      </div>
    )
  }

  if (!isMobile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
      >
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Application mobile requise</h1>
          <p className="text-sm text-gray-400">Le QR est disponible uniquement sur mobile.</p>
          <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 text-left">
              <Monitor className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Vous êtes sur un ordinateur</p>
                <p className="text-xs text-gray-400">Ouvrez l&apos;app sur votre téléphone</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <QrCode className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">QR dynamique sécurisé</p>
                <p className="text-xs text-gray-400">Renouvelé toutes les 6 secondes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {flashOverlay && (
        <div className="fixed inset-0 z-50 pointer-events-none" style={{
          background: "white",
          opacity: 0.8,
          mixBlendMode: "difference",
          animation: "flash 0.15s ease-out",
        }} />
      )}

      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">Accès à la salle</h1>
          <p className="text-xs text-gray-400 mt-0.5">Présentez au tourniquet</p>
        </div>

        <div ref={qrRef} className="relative" onContextMenu={(e) => e.preventDefault()}>
          <div
            className="rounded-3xl p-6 shadow-xl transition-all duration-300 border select-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: isHidden ? "rgba(255,77,77,0.4)" : "rgba(255,255,255,0.08)",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            <div
              className={`transition-all duration-300 ${
                isRefreshing || isHidden ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100 blur-none"
              }`}
              style={{ pointerEvents: "none" }}
            >
              {token ? (
                <QRCodeSVG
                  value={`IGC:${user?.id}:${encodeURIComponent(memberName)}:${token}`}
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-3xl backdrop-blur-md">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-500">QR masqué</p>
                  <p className="text-xs text-gray-400">Revenez sur l&apos;app pour révéler</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-base font-bold text-white">{memberName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Carte #{user?.id?.toString().slice(0, 8).toUpperCase() || "IGC-0000"}</p>
        </div>

        <div className="w-full max-w-[236px] space-y-2">
          <div className="text-center">
            <span className="text-3xl font-black tabular-nums text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #0A84FF, #0066CC)" }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Actualisation automatique toutes les 6 secondes
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
          <Lock className="w-3 h-3" />
          Protection anti-capture activée · Flash aléatoire
        </div>

        <p className="text-[10px] text-gray-500 text-center max-w-xs leading-relaxed px-4">
          QR dynamique contenant vos informations personnelles. 
          Toute tentative de capture d&apos;écran ou d&apos;enregistrement sera détectée.
        </p>
      </div>
    </div>
  )
}