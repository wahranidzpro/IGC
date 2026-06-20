"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth/context"
import { cn } from "@/lib/utils"
import {
  Trophy, Users, Calendar, Plus, Edit2, Medal, TrendingUp,
  Flame, X, Clock, Filter, AlertCircle,
} from "lucide-react"

const DEMO_CHALLENGES = [
  {
    id: 1, name: "Défi Cardio 30 Jours", description: "30 minutes de cardio par jour pendant 30 jours",
    type: "Cardio", startDate: "2026-05-01", endDate: "2026-05-30",
    participants: 12, reward: "1 mois offert", icon: "🏃‍♂️", status: "active",
  },
  {
    id: 2, name: "Summer Body Challenge", description: "Préparation estivale - perte de poids et tonification",
    type: "Fitness", startDate: "2026-06-01", endDate: "2026-07-15",
    participants: 8, reward: "Coaching gratuit", icon: "💪", status: "upcoming",
  },
  {
    id: 3, name: "Manger Sain, Vivre Mieux", description: "Adoptez une alimentation équilibrée sur 4 semaines",
    type: "Nutrition", startDate: "2026-04-15", endDate: "2026-05-13",
    participants: 15, reward: "Plan nutrition personnalisé", icon: "🥗", status: "active",
  },
  {
    id: 4, name: "Brûleur de Graisse", description: "Programme intensif de perte de poids avec suivi hebdomadaire",
    type: "Poids", startDate: "2026-03-01", endDate: "2026-04-30",
    participants: 10, reward: "Suppléments offerts", icon: "🔥", status: "ended",
  },
  {
    id: 5, name: "Défi Step Challenge", description: "10 000 pas par jour, 5 jours sur 7",
    type: "Cardio", startDate: "2026-05-10", endDate: "2026-06-10",
    participants: 20, reward: "T-shirt IGC", icon: "🏃‍♂️", status: "active",
  },
  {
    id: 6, name: "Hiver Vitalité", description: "Renforcez votre immunité avec du sport et une bonne nutrition",
    type: "Fitness", startDate: "2026-07-01", endDate: "2026-08-15",
    participants: 5, reward: "1 mois offert", icon: "💪", status: "upcoming",
  },
]

const DEMO_LEADERBOARDS: Record<number, { rank: number; name: string; progress: number; points: number }[]> = {
  1: [
    { rank: 1, name: "Sophie L.", progress: 100, points: 3200 },
    { rank: 2, name: "Karim M.", progress: 87, points: 2780 },
    { rank: 3, name: "Léa B.", progress: 72, points: 2300 },
    { rank: 4, name: "Rayan H.", progress: 65, points: 2080 },
    { rank: 5, name: "Inès K.", progress: 58, points: 1850 },
  ],
  3: [
    { rank: 1, name: "Amine Z.", progress: 95, points: 3040 },
    { rank: 2, name: "Maria P.", progress: 82, points: 2620 },
    { rank: 3, name: "Yanis T.", progress: 70, points: 2240 },
    { rank: 4, name: "Nour D.", progress: 60, points: 1920 },
    { rank: 5, name: "Sami R.", progress: 45, points: 1440 },
  ],
  5: [
    { rank: 1, name: "Hugo V.", progress: 98, points: 3130 },
    { rank: 2, name: "Emma C.", progress: 85, points: 2720 },
    { rank: 3, name: "Lucas F.", progress: 73, points: 2330 },
    { rank: 4, name: "Chloé N.", progress: 61, points: 1950 },
    { rank: 5, name: "Adam B.", progress: 50, points: 1600 },
  ],
}

const CHALLENGE_TYPES = ["Cardio", "Fitness", "Nutrition", "Poids"] as const

type FilterType = "Tous" | "Actifs" | "Terminés" | "À venir"
type SortType = "created" | "participants" | "active"

interface ChallengeForm {
  name: string
  description: string
  type: string
  goal: string
  startDate: string
  endDate: string
  reward: string
  icon: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  progress: number
  points: number
}

export default function ChallengesPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterType>("Tous")
  const [sort, setSort] = useState<SortType>("created")
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<typeof DEMO_CHALLENGES[number] | null>(null)
  const [leaderboardChallenge, setLeaderboardChallenge] = useState<typeof DEMO_CHALLENGES[number] | null>(null)
  const [formData, setFormData] = useState<ChallengeForm>({
    name: "", description: "", type: "Cardio", goal: "",
    startDate: "", endDate: "", reward: "", icon: "🏃‍♂️",
  })

  const openCreate = () => {
    setEditingChallenge(null)
    setFormData({ name: "", description: "", type: "Cardio", goal: "", startDate: "", endDate: "", reward: "", icon: "🏃‍♂️" })
    setShowForm(true)
  }

  const openEdit = (challenge: typeof DEMO_CHALLENGES[number]) => {
    setEditingChallenge(challenge)
    setFormData({
      name: challenge.name,
      description: challenge.description,
      type: challenge.type,
      goal: challenge.type,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      reward: challenge.reward || "",
      icon: challenge.icon,
    })
    setShowForm(true)
  }

  const statusLabel: Record<string, string> = {
    active: "Actif", ended: "Terminé", upcoming: "À venir",
  }

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ended: "bg-white/5 text-white/40 border-white/10",
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }

  const [now] = useState(() => Date.now())

  const calcDaysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const calcTotalDays = (startDate: string, endDate: string) => {
    return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

  const filtered = useMemo(() => {
    let result = [...DEMO_CHALLENGES]
    if (filter === "Actifs") result = result.filter((c) => c.status === "active")
    else if (filter === "Terminés") result = result.filter((c) => c.status === "ended")
    else if (filter === "À venir") result = result.filter((c) => c.status === "upcoming")

    if (sort === "participants") result.sort((a, b) => b.participants - a.participants)
    else if (sort === "active") result.sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1))
    else result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return result
  }, [filter, sort])

  const stats = useMemo(() => ({
    total: DEMO_CHALLENGES.length,
    participants: DEMO_CHALLENGES.reduce((a, c) => a + c.participants, 0),
    completion: Math.round(DEMO_CHALLENGES.filter((c) => c.status === "ended").length / DEMO_CHALLENGES.length * 100),
  }), [])

  if (!user) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Connexion requise</p>
          <p className="text-xs text-white/40">Connectez-vous pour accéder aux challenges.</p>
        </div>
      </div>
    )
  }

  const renderLeaderboard = () => {
    if (!leaderboardChallenge) return null
    const entries: LeaderboardEntry[] = DEMO_LEADERBOARDS[leaderboardChallenge.id] || []
    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-12 overflow-y-auto">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLeaderboardChallenge(null)} />
        <div className="relative w-full max-w-xl mx-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
                  Classement
                </h2>
                <p className="text-sm text-white/40 mt-0.5">{leaderboardChallenge.icon} {leaderboardChallenge.name}</p>
              </div>
              <button onClick={() => setLeaderboardChallenge(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {top3.map((e, i) => {
                  const medals = [
                    { bg: "from-yellow-500 to-yellow-600 shadow-yellow-500/30", icon: "🥇", label: "Or" },
                    { bg: "from-slate-300 to-slate-400 shadow-slate-300/30", icon: "🥈", label: "Argent" },
                    { bg: "from-amber-600 to-amber-700 shadow-amber-600/30", icon: "🥉", label: "Bronze" },
                  ][i]
                  const heights = ["h-32", "h-24", "h-20"]
                  return (
                    <div key={e.rank} className="flex flex-col items-center gap-2 pt-2">
                      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-lg shadow-lg", medals.bg)}>
                        {medals.icon}
                      </div>
                      <div className={cn(
                        "w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex flex-col items-center justify-end",
                        heights[i],
                      )}>
                        <p className="text-lg font-bold text-white">{e.points}</p>
                        <p className="text-[10px] text-white/50">{e.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-1.5">
                {rest.map((e) => (
                  <div key={e.rank} className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-white/40">{e.rank}</span>
                      <span className="text-sm text-white/80">{e.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" style={{ width: `${e.progress}%` }} />
                        </div>
                        <span className="text-xs text-white/40 w-8">{e.progress}%</span>
                      </div>
                      <span className="text-sm font-bold text-white/60 w-14 text-right">{e.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderForm = () => (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-12 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
              {editingChallenge ? "Modifier le Challenge" : "Créer un Challenge"}
            </h2>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Nom</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Ex: Défi Cardio 30 Jours" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" rows={3} placeholder="Décrivez le challenge..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Type</label>
                <select value={formData.type} onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all appearance-none cursor-pointer">
                  {CHALLENGE_TYPES.map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Icône</label>
                <div className="flex gap-1.5">
                  {["🏃‍♂️", "💪", "🥗", "🔥"].map((icon) => (
                    <button key={icon} type="button" onClick={() => setFormData((f) => ({ ...f, icon }))}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all",
                        formData.icon === icon
                          ? "bg-[#C89B3C]/20 border-[#C89B3C]/50"
                          : "bg-white/5 border-white/10 hover:border-[#C89B3C]/30",
                      )}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Objectif</label>
              <input type="text" value={formData.goal} onChange={(e) => setFormData((f) => ({ ...f, goal: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Ex: 30 min de cardio par jour" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Date début</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Date fin</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1.5 block">Récompense</label>
              <input type="text" value={formData.reward} onChange={(e) => setFormData((f) => ({ ...f, reward: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all placeholder:text-white/20" placeholder="Ex: 1 mois offert" />
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
            <Plus className="w-4 h-4" /> {editingChallenge ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      {showForm && renderForm()}
      {leaderboardChallenge && renderLeaderboard()}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] bg-clip-text text-transparent">
            Challenges
          </h1>
          <p className="text-sm text-white/40 mt-1">Créez des défis pour motiver vos adhérents</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#C89B3C]/20">
          <Plus className="w-4 h-4" /> Créer un Challenge
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["Tous", "Actifs", "Terminés", "À venir"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === f
                  ? "bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] text-black shadow-lg shadow-[#C89B3C]/20"
                  : "bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 hover:text-white hover:border-[#C89B3C]/30",
              )}>{f}</button>
          ))}
        </div>
        <div className="sm:ml-auto relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortType)}
            className="appearance-none pl-11 pr-10 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 focus:ring-1 focus:ring-[#C89B3C]/30 transition-all min-w-[160px] cursor-pointer">
            <option value="created" className="bg-gray-900">Date de création</option>
            <option value="participants" className="bg-gray-900">Plus de participants</option>
            <option value="active" className="bg-gray-900">En cours</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Aucun challenge</p>
          <p className="text-xs text-white/40">Créez votre premier challenge pour motiver vos adhérents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((challenge) => {
            const daysRemaining = calcDaysRemaining(challenge.endDate)
            const totalDays = calcTotalDays(challenge.startDate, challenge.endDate)
            const progress = challenge.status === "active"
              ? Math.round((totalDays - daysRemaining) / totalDays * 100)
              : challenge.status === "ended" ? 100 : 0

            return (
              <div key={challenge.id}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C89B3C] to-[#D4AF37]" />
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#D4AF37] flex items-center justify-center shrink-0 text-lg">
                        {challenge.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#C89B3C] transition-colors">{challenge.name}</h3>
                        <p className="text-[10px] text-white/40">{challenge.type}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", statusStyle[challenge.status] || "")}>
                      {statusLabel[challenge.status]}
                    </span>
                  </div>

                  <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{challenge.description}</p>

                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-white/30">
                      <Users className="w-3.5 h-3.5" /> {challenge.participants} participant{challenge.participants > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-white/30">
                      <Trophy className="w-3.5 h-3.5" /> {challenge.reward || "Aucune"}
                    </span>
                  </div>

                  {challenge.status === "active" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/30">
                          <Clock className="w-3 h-3 inline mr-1" />{daysRemaining} j restants
                        </span>
                        <span className="text-white/50">{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#C89B3C] to-[#D4AF37] transition-all duration-500"
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                    <button onClick={() => openEdit(challenge)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Modifier">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all" title="Assigner">
                      <Users className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setLeaderboardChallenge(challenge)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#C89B3C] hover:border-[#C89B3C]/30 transition-all ml-auto" title="Voir classement">
                      <Medal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/40">Défis créés</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.participants}</p>
            <p className="text-xs text-white/40">Participants total</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.completion}%</p>
            <p className="text-xs text-white/40">Taux de complétion moyen</p>
          </div>
        </div>
      </div>
    </div>
  )
}
