"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth/context"
import { cn } from "@/lib/utils"
import {
  Star, MessageSquare, ThumbsUp, Flag, Clock, TrendingUp,
  X, Send, ChevronRight, AlertCircle, Reply,
} from "lucide-react"

interface Review {
  id: number
  memberName: string
  rating: number
  date: string
  text: string
  tags: string[]
  avatar: string | null
}

const DEMO_REVIEWS: Review[] = [
  { id: 1, memberName: "Ahmed Benali", rating: 5, date: "2026-05-28", text: "Excellent coach ! Les programmes sont très bien adaptés à mes objectifs. Je recommande vivement.", tags: ["Programme", "Coaching"], avatar: null },
  { id: 2, memberName: "Sara El Amrani", rating: 4, date: "2026-05-25", text: "Très satisfaite du suivi nutritionnel. Résultats visibles en 3 semaines.", tags: ["Nutrition"], avatar: null },
  { id: 3, memberName: "Karim Mansouri", rating: 5, date: "2026-05-22", text: "Un coaching exceptionnel ! J'ai perdu 8 kg en 2 mois grâce à ses conseils.", tags: ["Programme", "Nutrition"], avatar: null },
  { id: 4, memberName: "Lina Bouchareb", rating: 4, date: "2026-05-20", text: "Séances de coaching très professionnelles. À l'écoute et motivant.", tags: ["Coaching"], avatar: null },
  { id: 5, memberName: "Youssef Hamdi", rating: 5, date: "2026-05-18", text: "Meilleur coach de la salle ! Toujours disponible pour ajuster les programmes.", tags: ["Programme", "Coaching"], avatar: null },
  { id: 6, memberName: "Nadia Cherif", rating: 3, date: "2026-05-15", text: "Bon suivi global mais les horaires pourraient être plus flexibles.", tags: ["Coaching"], avatar: null },
  { id: 7, memberName: "Amine Touati", rating: 4, date: "2026-05-12", text: "Très bon accompagnement, résultats au rendez-vous. Merci !", tags: ["Programme"], avatar: null },
  { id: 8, memberName: "Imane Seghir", rating: 5, date: "2026-05-10", text: "Un coach passionné qui transmet son énergie. Les séances sont variées et jamais ennuyeuses.", tags: ["Coaching", "Nutrition"], avatar: null },
  { id: 9, memberName: "Rachid Boulahfa", rating: 2, date: "2026-05-08", text: "Début prometteur mais j'aurais aimé plus de suivi entre les séances.", tags: ["Programme"], avatar: null },
  { id: 10, memberName: "Meriem Ouali", rating: 1, date: "2026-05-05", text: "Déçue du service. Les conseils nutritionnels n'étaient pas personnalisés.", tags: ["Nutrition"], avatar: null },
  { id: 11, memberName: "Sami Khelifi", rating: 5, date: "2026-05-02", text: "Coach au top ! Très professionnel et sympathique. Je recommande à 100%.", tags: ["Coaching"], avatar: null },
  { id: 12, memberName: "Dounia Merad", rating: 4, date: "2026-04-28", text: "Bonne expérience globale. Les programmes sont bien structurés et évolutifs.", tags: ["Programme", "Coaching"], avatar: null },
]

function getRelativeDate(dateStr: string) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`
  return `Il y a ${Math.floor(days / 30)} mois`
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function AvisPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(DEMO_REVIEWS)
  const [sort, setSort] = useState<"recent" | "best" | "worst">("recent")
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [replyModal, setReplyModal] = useState<{ review: Review; text: string } | null>(null)
  const [sendingReply, setSendingReply] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 5

  const stats = useMemo(() => {
    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = total > 0 ? sum / total : 0
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => { counts[r.rating as keyof typeof counts]++ })
    const satisfaction = total > 0 ? Math.round((reviews.filter((r) => r.rating >= 4).length / total) * 100) : 0
    const recommendation = total > 0 ? Math.round((reviews.filter((r) => r.rating >= 4).length / total) * 100) : 0
    return { total, avg, counts, satisfaction, recommendation }
  }, [reviews])

  const filtered = useMemo(() => {
    let result = [...reviews]
    if (ratingFilter) result = result.filter((r) => r.rating === ratingFilter)
    if (sort === "recent") result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (sort === "best") result.sort((a, b) => b.rating - a.rating)
    if (sort === "worst") result.sort((a, b) => a.rating - b.rating)
    return result
  }, [reviews, sort, ratingFilter])

  const paginated = filtered.slice(0, page * perPage)
  const hasMore = paginated.length < filtered.length

  const handleSendReply = async () => {
    if (!replyModal || !replyModal.text.trim()) return
    setSendingReply(true)
    await new Promise((r) => setTimeout(r, 800))
    setSendingReply(false)
    setReplyModal(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
              Avis Clients
            </h1>
            <p className="text-sm text-white/50 mt-1">Consultez les retours de vos adhérents</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-6 h-6 fill-current",
                      s <= Math.round(stats.avg) ? "text-[#C89B3C]" : "text-white/10"
                    )}
                  />
                ))}
              </div>
              <span className="text-3xl font-black text-white">{stats.avg.toFixed(1)}</span>
              <span className="text-sm text-white/40">/ 5</span>
              <span className="text-sm text-white/30 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                basé sur {stats.total} avis
              </span>
            </div>

            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = stats.counts[s as keyof typeof stats.counts]
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <button
                    key={s}
                    onClick={() => setRatingFilter(ratingFilter === s ? null : s)}
                    className={cn(
                      "flex items-center gap-2 w-full group transition-all",
                      ratingFilter === s && "opacity-100"
                    )}
                  >
                    <span className="text-xs text-white/40 w-4 text-right">{s}</span>
                    <Star className={cn(
                      "w-3.5 h-3.5 fill-current",
                      ratingFilter === s ? "text-[#C89B3C]" : "text-white/20 group-hover:text-white/40"
                    )} />
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-6">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "Tous", value: null },
                { label: "5★", value: 5 },
                { label: "4★", value: 4 },
                { label: "3★", value: 3 },
                { label: "2★", value: 2 },
                { label: "1★", value: 1 },
              ].map((f) => (
                <button
                  key={f.label}
                  onClick={() => setRatingFilter(f.value)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                    ratingFilter === f.value
                      ? "bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black border-transparent shadow-lg shadow-[#C89B3C]/20"
                      : "bg-white/5 backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:border-[#C89B3C]/30"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 sm:ml-auto">
              <Clock className="w-4 h-4 text-white/30" />
              {(["recent", "best", "worst"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                    sort === s
                      ? "bg-white/10 border-[#C89B3C]/40 text-[#C89B3C]"
                      : "bg-transparent border-transparent text-white/40 hover:text-white/60"
                  )}
                >
                  {s === "recent" ? "Plus récents" : s === "best" ? "Meilleure note" : "Moins bonne note"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-lg font-bold text-white mb-1">Aucun avis trouvé</p>
                <p className="text-sm text-white/40">Essayez de modifier vos filtres</p>
              </div>
            ) : (
              paginated.map((review) => (
                <div
                  key={review.id}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(200,155,60,0.08)] hover:border-[#C89B3C]/20"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] opacity-60" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center text-sm font-bold text-black shrink-0">
                        {review.avatar ? null : getInitials(review.memberName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white">{review.memberName}</p>
                          <span className="text-[10px] text-white/30">·</span>
                          <span className="text-[10px] text-white/40">{getRelativeDate(review.date)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "w-3.5 h-3.5 fill-current",
                                s <= review.rating ? "text-[#C89B3C]" : "text-white/10"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed">{review.text}</p>

                    {review.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {review.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C]/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => setReplyModal({ review, text: "" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:text-[#C89B3C] hover:bg-[#C89B3C]/10 transition-all border border-transparent hover:border-[#C89B3C]/20"
                      >
                        <Reply className="w-3.5 h-3.5" /> Répondre
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                        <Flag className="w-3.5 h-3.5" /> Signaler
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 hover:border-[#C89B3C]/30 transition-all"
                >
                  Voir plus d&apos;avis <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C89B3C]" /> Statistiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Satisfaction", value: `${stats.satisfaction}%`, icon: ThumbsUp, color: "text-green-400" },
                { label: "Recommandation", value: `${stats.recommendation}%`, icon: Star, color: "text-[#C89B3C]" },
                { label: "Retour moyen", value: `${stats.avg.toFixed(1)}/5`, icon: TrendingUp, color: "text-blue-400" },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.label}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.07] hover:border-[#C89B3C]/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/10 flex items-center justify-center">
                        <Icon className={cn("w-5 h-5", s.color)} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-xs text-white/40 mt-1">{s.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-white">Aperçu des avis</h3>
            <div className="space-y-3">
              {[
                { label: "Total avis", value: stats.total, icon: MessageSquare },
                { label: "Moyenne générale", value: stats.avg.toFixed(1), icon: Star },
                { label: "Taux de réponse", value: "0%", icon: Reply },
                { label: "Avis avec réponse", value: 0, icon: ThumbsUp },
                { label: "Avis sans réponse", value: stats.total, icon: AlertCircle },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C89B3C]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#C89B3C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/40">{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReplyModal(null)}
          />
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0a1525] to-[#060d18] backdrop-blur-2xl border border-[rgba(200,155,60,0.2)] rounded-2xl shadow-[0_0_60px_rgba(200,155,60,0.1)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Reply className="w-5 h-5 text-[#C89B3C]" /> Répondre à l&apos;avis
                </h3>
                <button
                  onClick={() => setReplyModal(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                    {getInitials(replyModal.review.memberName)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{replyModal.review.memberName}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-3 h-3 fill-current",
                            s <= replyModal.review.rating ? "text-[#C89B3C]" : "text-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/60">{replyModal.review.text}</p>
              </div>

              <textarea
                value={replyModal.text}
                onChange={(e) => setReplyModal({ ...replyModal, text: e.target.value })}
                placeholder="Écrivez votre réponse..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setReplyModal(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyModal.text.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20 disabled:opacity-50"
                >
                  {sendingReply ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
