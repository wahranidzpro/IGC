"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { verifyDevice, registerDevice, requestTransferOtp, confirmTransferOtp } from "@/lib/device"
import { ShieldAlert, Smartphone, CheckCircle2 } from "lucide-react"

type LoginStep = "form" | "device_lock" | "otp_sent" | "success"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<LoginStep>("form")
  const [deviceReason, setDeviceReason] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const [otpMessage, setOtpMessage] = useState("")
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.push("/dashboard")
  }, [user, loading, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    const deviceCheck = await verifyDevice({ email })
    if (deviceCheck.allowed) {
      if (deviceCheck.reason === "PREMIER_APPAREIL" && deviceCheck.profileId) {
        await registerDevice(deviceCheck.profileId)
      }
      router.push("/dashboard")
      return
    }

    setProfileId(deviceCheck.profileId || null)
    setDeviceReason(deviceCheck.reason || "")
    setStep("device_lock")
    setSubmitting(false)
  }

  const handleRequestOtp = async () => {
    if (!profileId) return
    setOtpSending(true)
    setOtpError("")
    const res = await requestTransferOtp(profileId)
    if (res.success) {
      setOtpMessage(res.error || "Code envoyé")
      setStep("otp_sent")
    } else {
      setOtpError(res.error || "Erreur d'envoi")
    }
    setOtpSending(false)
  }

  const handleConfirmOtp = async () => {
    if (!profileId || !otp) return
    setOtpError("")
    setSubmitting(true)
    const res = await confirmTransferOtp(profileId, otp)
    if (res.success) {
      setStep("success")
      setTimeout(() => router.push("/dashboard"), 1500)
    } else {
      setOtpError(res.error || "Code invalide")
    }
    setSubmitting(false)
  }

  if (step === "device_lock") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Appareil non reconnu</h1>
          <p className="text-sm text-muted-foreground">
            Un nouvel appareil tente d&apos;accéder à votre compte.
            Pour des raisons de sécurité, veuillez vérifier votre identité.
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={handleRequestOtp} disabled={otpSending}>
              <Smartphone className="w-4 h-4 mr-2" />
              {otpSending ? "Envoi..." : "Envoyer un code de vérification"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setStep("form"); setError(""); setProfileId(null) }}
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (step === "otp_sent") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Smartphone className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Code de vérification</h1>
          <p className="text-sm text-muted-foreground">
            {otpMessage || "Un code à 6 chiffres vous a été envoyé par email."}
          </p>

          <div className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl tracking-[0.5em] rounded-md border border-input bg-background px-3 py-3 font-mono"
              placeholder="000000"
            />
            {otpError && <p className="text-sm text-destructive">{otpError}</p>}
            <Button className="w-full" onClick={handleConfirmOtp} disabled={submitting || otp.length !== 6}>
              {submitting ? "Vérification..." : "Transférer l'accès"}
            </Button>
            <button
              className="text-sm text-muted-foreground hover:underline w-full"
              onClick={handleRequestOtp}
            >
              Renvoyer le code
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Appareil autorisé</h1>
          <p className="text-muted-foreground">Redirection vers le tableau de bord...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/logo-transparent.png"
            alt="Infinity Gym Center"
            width={100}
            height={106}
            priority
            className="mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold">Infinity Gym Center</h1>
          <p className="text-muted-foreground text-sm">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="exemple@email.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-primary hover:underline">S&apos;inscrire</Link>
        </p>
      </div>
    </main>
  )
}
