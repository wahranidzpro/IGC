"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import {
  CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, ShieldCheck, TrendingUp, Clock,
} from "lucide-react"
import type { Membership, Payment } from "@/types"

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
    const uid = user.id
    const supabase = createClient()

    async function load() {
      try {
        const { data: mData } = await supabase.from("members").select("*").eq("profileId", uid).maybeSingle()
        const memberId = (mData as { id?: string } | null)?.id
        if (!memberId) { setLoading(false); return }

        const { data: ms } = await supabase
          .from("memberships")
          .select("*")
          .eq("memberId", memberId)
          .order("startDate", { ascending: false })
        const all = (ms as unknown as Membership[]) || []
        setActiveMembership(all.find((m) => m.status === "active") || null)
        setHistory(all)

        const { data: pts } = await supabase
          .from("payments")
          .select("*")
          .eq("memberId", memberId)
          .order("paidAt", { ascending: false })
          .limit(10)
        if (pts) setPayments(pts as unknown as Payment[])
      } catch {
        console.error("Erreur chargement abonnement")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-56 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
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
        <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Mon abonnement</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre abonnement et suivez vos renouvellements</p>
      </div>

      {expiringSoon && activeMembership && !expired && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Abonnement expire bientôt</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Il ne reste plus que <strong>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong>.
              Pensez à renouveler pour continuer à profiter de nos installations.
            </p>
          </div>
        </div>
      )}

      {expired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">Abonnement expiré</p>
            <p className="text-xs text-red-700 mt-0.5">
              Votre abonnement a expiré. Renouvelez dès maintenant pour réactiver votre accès.
            </p>
          </div>
        </div>
      )}

      {!activeMembership ? (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-brand-black mb-1">Aucun abonnement actif</h3>
          <p className="text-sm text-gray-500 mb-5">Souscrivez à un abonnement pour accéder à nos installations</p>
          <button className="bg-brand-red text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
            Voir les offres
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border shadow-lg shadow-black/5 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red to-red-700 px-6 py-5 text-white">
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
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Progression</span>
                <span className="text-xs font-bold text-brand-black">{daysLeft > 0 ? daysLeft : 0} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    daysLeft <= 7
                      ? "bg-red-500"
                      : daysLeft <= 15
                      ? "bg-amber-500"
                      : "bg-brand-red"
                  }`}
                  style={{ width: `${100 - elapsedPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Début</p>
                  <p className="text-sm font-bold text-brand-black mt-0.5">
                    {new Date(activeMembership.startDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Fin</p>
                  <p className="text-sm font-bold text-brand-black mt-0.5">
                    {new Date(activeMembership.endDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renouvellement auto
                </span>
                <span className={`flex items-center gap-1.5 font-bold text-xs ${
                  activeMembership.autoRenew ? "text-green-600" : "text-gray-400"
                }`}>
                  {activeMembership.autoRenew ? (
                    <><ShieldCheck className="w-3.5 h-3.5" /> Activé</>
                  ) : "Désactivé"}
                </span>
              </div>

              {activeMembership.sessionsTotal && (
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Séances
                  </span>
                  <span className="font-bold text-brand-black text-xs">
                    {activeMembership.sessionsUsed} / {activeMembership.sessionsTotal}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-lg shadow-black/5 overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historique des renouvellements
              </h3>
              <span className="text-xs text-gray-400">{history.length} abonnement{history.length > 1 ? "s" : ""}</span>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun historique</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map((m, i) => {
                  const mDays = Math.ceil((new Date(m.endDate).getTime() - new Date(m.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          m.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {m.status === "active" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-black">{m.planName}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(m.startDate).toLocaleDateString("fr-FR")} — {new Date(m.endDate).toLocaleDateString("fr-FR")}
                            {" · "}{mDays} jours
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-black">{m.amount.toLocaleString()} DZD</p>
                        <p className={`text-[10px] font-medium ${
                          m.status === "active" ? "text-green-600" : "text-gray-400"
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

          <div className="bg-white rounded-2xl border shadow-lg shadow-black/5 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Paiements récents
              </h3>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        p.status === "completed"
                          ? "bg-green-50 text-green-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {p.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-black capitalize">{p.method?.replace("_", " ") || "Paiement"}</p>
                        <p className="text-[10px] text-gray-500">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-brand-black">{p.amount.toLocaleString()} DZD</p>
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
