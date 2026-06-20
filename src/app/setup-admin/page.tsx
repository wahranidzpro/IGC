"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SetupAdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (status === "idle") {
      const timer = setTimeout(() => {
        setStatus("loading")
        fetch("/api/setup-admin")
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setStatus("done")
              setMessage(data.message)
            } else if (data.message?.includes("déjà admin")) {
              setStatus("done")
              setMessage(data.message)
              setTimeout(() => router.push("/admin"), 1500)
            } else {
              setStatus("error")
              setMessage(data.error || "Erreur inconnue")
            }
          })
          .catch((e) => {
            setStatus("error")
            setMessage(e.message)
          })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const sb = createClient()
    await sb.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0B0B] via-[#1a0808] to-[#0B0B0B]">
      <div className="max-w-md mx-auto p-8 text-center">
        {status === "loading" && (
          <div className="text-white">
            <div className="animate-spin w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full mx-auto mb-6" />
            <p className="text-lg font-semibold">Configuration de votre compte admin...</p>
          </div>
        )}
        {status === "done" && (
          <div>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h1 className="text-2xl font-bold text-white mb-4">Prêt !</h1>
            <p className="text-white/70 mb-6">{message}</p>
            <button
              onClick={handleLogout}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-accent text-white font-bold hover:opacity-90 transition-all"
            >
              Se déconnecter et se reconnecter
            </button>
          </div>
        )}
        {status === "error" && (
          <div>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✗</div>
            <h1 className="text-2xl font-bold text-white mb-4">Erreur</h1>
            <p className="text-white/70 mb-2">{message}</p>
            <p className="text-white/40 text-sm mb-6">
              Vérifie que tu es bien connecté, puis réessaie.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="px-8 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
