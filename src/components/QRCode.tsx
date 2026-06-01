"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/hooks/useAuth"

const REFRESH_INTERVAL = 5000
const TOKEN_LIFETIME = 15

export default function QRCode() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL / 1000)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generateToken = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch("/api/qr/generate", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur de génération")
        return
      }

      setToken(data.token)
      setExpiresAt(new Date(data.expiresAt))
      setTimeLeft(REFRESH_INTERVAL / 1000)
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    generateToken()
    const refreshInterval = setInterval(generateToken, REFRESH_INTERVAL)
    const tickInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => {
      clearInterval(refreshInterval)
      clearInterval(tickInterval)
    }
  }, [generateToken])

  const progress = (timeLeft / (REFRESH_INTERVAL / 1000)) * 100

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-64 h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-64 h-64 bg-muted rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <button
          onClick={generateToken}
          className="text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const qrContent = `IGC:${user?.id}:${token}`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <QRCodeSVG
          value={qrContent}
          size={240}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#0f3460"
          includeMargin
        />
      </div>

      <div className="w-64 space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {timeLeft > 0
            ? `Prochain rafraîchissement dans ${timeLeft}s`
            : "Rafraîchissement..."}
        </p>
      </div>
    </div>
  )
}
