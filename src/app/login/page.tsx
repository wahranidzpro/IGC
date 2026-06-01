"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Shield, Dumbbell, ArrowRight, Lock, Eye, EyeOff } from "lucide-react"

type LoginTab = "admin" | "adherent"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [tab, setTab] = useState<LoginTab>("admin")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.push("/admin")
  }, [user, loading, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0B0B] via-[#1a0808] to-[#0B0B0B]">
      <div className="animate-spin w-8 h-8 border-4 border-[#E10600] border-t-transparent rounded-full" />
    </div>
  )
  if (user) return null

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "")
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const identifier = tab === "admin" ? username : phone.replace(/\s/g, "")
    if (!identifier || !password) {
      setError("Veuillez remplir tous les champs")
      setSubmitting(false)
      return
    }

    const email = `${identifier}@infinitygym.local`
    const result = await login(email, password)
    if (result.error) {
      setError(result.error === "Invalid login credentials" ? "Identifiants incorrects" : result.error)
      setSubmitting(false)
      return
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0B0B0B] via-[#1a0808] to-[#0B0B0B]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo-transparent.png"
            alt="Infinity Gym Center"
            width={90}
            height={96}
            priority
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white">Infinity Gym Center</h1>
          <p className="text-white/50 text-sm mt-1">Système de gestion de salle de sport</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border border-white/10">
          <div className="flex bg-black/40 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab("admin"); setError("") }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${tab === "admin" ? "bg-gradient-to-r from-[#E10600] to-[#FF6B00] text-white shadow-lg" : "text-white/60 hover:text-white"}`}
            >
              <Shield className="w-4 h-4" />
              Administrateur
            </button>
            <button
              onClick={() => { setTab("adherent"); setError("") }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${tab === "adherent" ? "bg-gradient-to-r from-[#E10600] to-[#FF6B00] text-white shadow-lg" : "text-white/60 hover:text-white"}`}
            >
              <Dumbbell className="w-4 h-4" />
              Adhérent
            </button>
          </div>

          <div className="px-6 pb-6">
            {tab === "admin" ? (
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Connexion Staff</h2>
                <p className="text-white/40 text-sm mb-6">Accédez au tableau de bord</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Nom d&apos;utilisateur</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-all"
                      placeholder="admin"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-all pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-6 rounded-xl bg-gradient-to-r from-[#E10600] to-[#FF6B00] text-white font-bold hover:opacity-90 transition-all text-base"
                  >
                    {submitting ? "Connexion..." : "Se connecter"}
                    {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push("/forgot-password")}
                    className="text-sm text-white/40 hover:text-[#FF6B00] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Connexion Adhérent</h2>
                <p className="text-white/40 text-sm mb-6">Accédez à votre espace</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Numéro de téléphone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-all tracking-wider"
                      placeholder="05 XX XX XX XX"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-all pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-6 rounded-xl bg-gradient-to-r from-[#E10600] to-[#FF6B00] text-white font-bold hover:opacity-90 transition-all text-base"
                  >
                    {submitting ? "Connexion..." : "Accéder à mon espace"}
                    {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs text-center">
                    ⚠️ Pas encore inscrit ? Veuillez vous rapprocher de l&apos;administration du club pour créer votre compte adhérent.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setTab(tab === "admin" ? "adherent" : "admin")}
            className="text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            {tab === "admin" ? "Connexion Adhérent" : "Connexion Staff"}
          </button>
        </div>
      </div>
    </main>
  )
}
