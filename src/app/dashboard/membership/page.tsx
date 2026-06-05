"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import {
  CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, ShieldCheck, TrendingUp, Clock,
} from "lucide-react"
import type { Member, Membership, Payment } from "@/types"

const typeLabels: Record<string, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
  custom: "Personnalisé",
}

export default function MembershipPage() {
  const { user } = useAuth()
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null)
  const [history, setHistory] = useState<Membership[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("*").eq("profile_id", uid).maybeSingle()
        const m = mData ? mapRow<Member>(mData) : null
        const memberId = m?.id
        if (!memberId) { setLoading(false); return }

        const { data: ms } = await supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberId)
          .order("start_date", { ascending: false })
        const all = ms ? mapRows<Membership>(ms) : []
        setActiveMembership(all.find((m) => m.status === "active") || null)
        setHistory(all)

        const { data: pts } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberId)
          .order("paid_at", { ascending: false })
          .limit(10)
        if (pts) setPayments(mapRows<Payment>(pts))
      } catch {
        logger.error('Erreur chargement abonnement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-56 rounded-2xl shimmer" />
        <div className="h-40 rounded-2xl shimmer" />
      </div>
    )
  }

  const daysLeft = activeMembership
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const totalDays = activeMembership
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - new Date(activeMembership.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1
  const elapsedPercent = activeMembership
    ? Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100))
    : 0
  const expiringSoon = activeMembership && daysLeft <= 15
  const expired = activeMembership && daysLeft < 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Mon abonnement</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez votre abonnement et suivez vos renouvellements</p>
      </div>

      {expiringSoon && activeMembership && !expired && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">L'abonnement expire bientôt</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Il ne reste plus que <strong>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong>.
              Pensez à renouveler pour continuer à profiter de nos installations.
            </p>
          </div>
        </div>
      )}

      {expired && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-300">Abonnement expiré</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Votre abonnement a expiré. Renouvelez dès maintenant pour réactiver votre accès.
            </p>
          </div>
        </div>
      )}

      {!activeMembership ? (
        <div className="glass-strong rounded-2xl border border-white/10 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Aucun abonnement actif</h3>
          <p className="text-sm text-gray-400 mb-5">Souscrivez à un abonnement pour accéder à nos installations</p>
          <button className="bg-brand-gold text-brand-black px-6 py-3 rounded-xl text-sm font-bold hover:brightness-110 transition-colors shadow-lg shadow-brand-gold/20">
            Voir les offres
          </button>
        </div>
      ) : (
        <>
          <div className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-brand-gold to-yellow-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      {typeLabels[activeMembership.type] || activeMembership.type}
                    </p>
                    <p className="text-xl font-bold">{activeMembership.planName}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  activeMembership.status === "active"
                    ? "bg-green-400/20 text-green-300"
                    : activeMembership.status === "expired"
                    ? "bg-red-400/20 text-red-300"
                    : "bg-white/10 text-white/60"
                }`}>
                  {activeMembership.status === "active" ? "Actif" : activeMembership.status}
                </span>
              </div>
              <div className="text-3xl font-black">{activeMembership.amount.toLocaleString()} DZD</div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Progression</span>
                <span className="text-xs font-bold text-white">{daysLeft > 0 ? daysLeft : 0} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    daysLeft <= 7
                      ? "bg-red-500"
                      : daysLeft <= 15
                      ? "bg-amber-500"
                      : "bg-brand-gold"
                  }`}
                  style={{ width: `${100 - elapsedPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Début</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {new Date(activeMembership.startDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Fin</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {new Date(activeMembership.endDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renouvellement auto
                </span>
                <span className={`flex items-center gap-1.5 font-bold text-xs ${
                  activeMembership.autoRenew ? "text-green-400" : "text-gray-500"
                }`}>
                  {activeMembership.autoRenew ? (
                    <><ShieldCheck className="w-3.5 h-3.5" /> Activé</>
                  ) : "Désactivé"}
                </span>
              </div>

              {activeMembership.sessionsTotal && (
                <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Séances
                  </span>
                  <span className="font-bold text-white text-xs">
                    {activeMembership.sessionsUsed} / {activeMembership.sessionsTotal}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historique des renouvellements
              </h3>
              <span className="text-xs text-gray-400">{history.length} abonnement{history.length > 1 ? "s" : ""}</span>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun historique</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((m, i) => {
                  const mDays = Math.ceil((new Date(m.endDate).getTime() - new Date(m.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          m.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-white/5 text-gray-500"
                        }`}>
                          {m.status === "active" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{m.planName}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(m.startDate).toLocaleDateString("fr-FR")} — {new Date(m.endDate).toLocaleDateString("fr-FR")}
                            {" · "}{mDays} jours
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{m.amount.toLocaleString()} DZD</p>
                        <p className={`text-[10px] font-medium ${
                          m.status === "active" ? "text-green-400" : "text-gray-500"
                        }`}>
                          {m.status === "active" ? "En cours" : m.status === "expired" ? "Expiré" : m.status}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Paiements récents
              </h3>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        p.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {p.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{p.method?.replace("_", " ") || "Paiement"}</p>
                        <p className="text-[10px] text-gray-400">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">{p.amount.toLocaleString()} DZD</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
