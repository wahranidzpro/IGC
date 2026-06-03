"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/context"
import {
  Lock, Smartphone, Monitor, Shield, History, LogOut, Trash2,
  Eye, EyeOff, Check, X, Clock, Laptop, Bell,
  Fingerprint, AlertCircle, RefreshCw, Settings,
} from "lucide-react"

interface Device {
  name: string
  type: string
  browser: string
  ip: string
  lastActive: string
  status: "online" | "offline"
}

const sampleCurrentDevice: Device = {
  name: "iPhone 15 Pro",
  type: "smartphone",
  browser: "Safari 18.0",
  ip: "197.200.x.x",
  lastActive: "À l'instant",
  status: "online",
}

const sampleDeviceHistory: Device[] = [
  { name: "MacBook Air M3", type: "laptop", browser: "Chrome 125", ip: "197.200.x.x", lastActive: "Il y a 2 heures", status: "online" },
  { name: "Samsung Galaxy S24", type: "smartphone", browser: "Chrome 125", ip: "105.105.x.x", lastActive: "Hier 18:30", status: "offline" },
  { name: "iPad Pro 12.9", type: "tablet", browser: "Safari 18.0", ip: "197.200.x.x", lastActive: "Mar 12 14:00", status: "offline" },
  { name: "Windows Desktop", type: "laptop", browser: "Edge 124", ip: "41.200.x.x", lastActive: "Lun 10 09:15", status: "offline" },
]

export default function SettingsPage() {
  const { logout } = useAuth()
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" })
  const [showPassword, setShowPassword] = useState({ current: false, newPass: false, confirm: false })
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null)
  const [deviceHistory, setDeviceHistory] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setCurrentDevice(sampleCurrentDevice)
        setDeviceHistory(sampleDeviceHistory)
        setError(null)
      } catch {
        setError("Impossible de charger les paramètres")
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const handlePasswordSave = () => {
    if (!passwordForm.current || !passwordForm.newPass || passwordForm.newPass !== passwordForm.confirm) return
    setPasswordSaved(true)
    setPasswordForm({ current: "", newPass: "", confirm: "" })
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "smartphone") return <Smartphone className="w-4 h-4" />
    if (type === "tablet") return <Monitor className="w-4 h-4" />
    return <Laptop className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-brand-red font-medium hover:underline flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!currentDevice) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Settings className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Aucun paramètre disponible</p>
          <p className="text-sm text-gray-500">Les paramètres seront chargés ultérieurement.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre compte et votre sécurité</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-red" />
          <h3 className="text-sm font-bold text-brand-black">Changer le mot de passe</h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {[
            { key: "current" as const, label: "Mot de passe actuel", value: passwordForm.current, show: showPassword.current },
            { key: "newPass" as const, label: "Nouveau mot de passe", value: passwordForm.newPass, show: showPassword.newPass },
            { key: "confirm" as const, label: "Confirmer le mot de passe", value: passwordForm.confirm, show: showPassword.confirm },
          ].map((field) => (
            <div key={field.key} className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">{field.label}</label>
              <div className="relative">
                <input
                  type={field.show ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword((s) => ({ ...s, [field.key]: !s[field.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {passwordForm.newPass && (
                <span className={`flex items-center gap-1 ${passwordForm.newPass.length >= 8 ? "text-green-600" : "text-amber-600"}`}>
                  {passwordForm.newPass.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Min. 8 caractères
                </span>
              )}
            </div>
            <button
              onClick={handlePasswordSave}
              disabled={!passwordForm.current || !passwordForm.newPass || passwordForm.newPass !== passwordForm.confirm}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-red hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {passwordSaved ? "Mot de passe mis à jour ✓" : "Mettre à jour"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-brand-red" />
          <h3 className="text-sm font-bold text-brand-black">Appareil connecté</h3>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-red/5 to-transparent border border-brand-red/10">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
              <DeviceIcon type={currentDevice.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-brand-black">{currentDevice.name}</p>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  En ligne
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{currentDevice.browser}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                <span>IP: {currentDevice.ip}</span>
                <span>Dernière activité: {currentDevice.lastActive}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-red" />
            <h3 className="text-sm font-bold text-brand-black">Historique des appareils</h3>
          </div>
          <span className="text-xs text-gray-400">{deviceHistory.length} appareil{deviceHistory.length > 1 ? "s" : ""}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {deviceHistory.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Aucun autre appareil</p>
            </div>
          ) : (
            deviceHistory.map((device, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <DeviceIcon type={device.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-black">{device.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      device.status === "online" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {device.status === "online" ? "En ligne" : "Hors ligne"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{device.browser} · IP: {device.ip}</p>
                  <p className="text-[10px] text-gray-400">{device.lastActive}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50">
          <button className="text-xs font-medium text-brand-red hover:underline">Déconnecter tous les appareils</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-red" />
          <h3 className="text-sm font-bold text-brand-black">Sécurité du compte</h3>
        </div>
        <div className="divide-y divide-gray-50 px-5 pb-2">
          {[
            { icon: Fingerprint, label: "Authentification à deux facteurs", desc: "Protégez votre compte avec une couche supplémentaire", enabled: false },
            { icon: Bell, label: "Alertes de connexion", desc: "Recevez une notification lors d'une nouvelle connexion", enabled: true },
            { icon: History, label: "Sessions actives", desc: "Gérez vos sessions en cours", enabled: null },
            { icon: LogOut, label: "Déconnexion automatique", desc: "Déconnexion après 30 min d'inactivité", enabled: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-black">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
              {item.enabled !== null ? (
                <div className={`w-11 h-6 rounded-full relative transition-colors ${item.enabled ? "bg-brand-red" : "bg-gray-200"}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${item.enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </div>
              ) : (
                <span className="text-xs font-medium text-brand-red">Gérer</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-5 py-4 bg-white rounded-2xl border shadow-sm hover:bg-red-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-sm font-bold text-red-600">Déconnexion</span>
        </button>

        <button className="flex items-center gap-2 mx-auto text-xs text-gray-400 hover:text-red-500 transition-colors pt-2">
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer mon compte
        </button>
      </div>
    </div>
  )
}
