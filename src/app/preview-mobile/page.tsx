"use client"

import type { LucideIcon } from "lucide-react"
import { Bell, CreditCard, MessageSquare, Megaphone } from "lucide-react"

// ── Mock tabs like notifications ──
const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  abonnement: { icon: CreditCard, color: "#C89B3C", bg: "rgba(200,155,60,0.1)" },
  coach: { icon: MessageSquare, color: "#0A84FF", bg: "rgba(10,132,255,0.1)" },
  promo: { icon: Megaphone, color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  system: { icon: Bell, color: "#6B7280", bg: "rgba(255,255,255,0.05)" },
}

const mockNotifs = [
  { id: "1", title: "Abonnement renouvelé", description: "Votre abonnement Premium a été renouvelé avec succès.", type: "abonnement", isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "2", title: "Nouveau cours disponible", description: "Un cours de HIIT a été ajouté au planning de demain.", type: "coach", isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", title: "Promo été -20%", description: "Profitez de -20% sur tous les abonnements jusqu'au 31 août.", type: "promo", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
]


const mockWeightData = [
  { week: "S-8", poids: 82.5 },
  { week: "S-6", poids: 81.0 },
  { week: "S-4", poids: 79.5 },
  { week: "S-2", poids: 78.4 },
  { week: "S-0", poids: 78.0 },
]
const maxW = Math.max(...mockWeightData.map((w) => w.poids))
const minW = Math.min(...mockWeightData.map((w) => w.poids))
const rangeW = maxW - minW || 1

const badges = [
  { name: "10 séances", earned: true, emoji: "🏅" },
  { name: "25 séances", earned: true, emoji: "🏅" },
  { name: "50 séances", earned: false, emoji: "🔒" },
  { name: "100 séances", earned: false, emoji: "🔒" },
]

const macros = [
  { label: "Calories", value: "1 850", target: "2 200", icon: "🔥", color: "#FF6B35" },
  { label: "Protéines", value: "120", target: "150", icon: "🥩", color: "#0A84FF" },
  { label: "Glucides", value: "200", target: "250", icon: "🌾", color: "#C89B3C" },
  { label: "Lipides", value: "45", target: "65", icon: "💧", color: "#10B981" },
]

const meals = [
  { name: "Petit-déjeuner", time: "07:30", calories: 450, items: ["Flocons d'avoine", "Banane, miel, amandes"], color: "#0A84FF", emoji: "🌅" },
  { name: "Déjeuner", time: "12:30", calories: 680, items: ["Poulet grillé, riz", "Brocoli, huile d'olive"], color: "#10B981", emoji: "☀️" },
  { name: "Collation", time: "16:00", calories: 250, items: ["Yaourt grec", "Fruits rouges, granola"], color: "#C89B3C", emoji: "⚡" },
  { name: "Dîner", time: "20:00", calories: 470, items: ["Saumon, patate douce", "Salade verte"], color: "#A855F7", emoji: "🌙" },
]

const advantages = [
  "Accès illimité à la salle",
  "Coaching personnalisé",
  "Cours collectifs illimités",
  "Invitations (2/mois)",
  "Accès application mobile",
  "Nutrition coaching",
]

const plusMenuSections = [
  {
    title: "PERFORMANCE",
    items: [
      { icon: "💪", label: "Exercices", color: "#FF4D4D" },
      { icon: "🥗", label: "Nutrition", color: "#FF6B35" },
      { icon: "📊", label: "Mes Progrès", color: "#10B981" },
      { icon: "🏆", label: "Défis & Badges", color: "#FF4D4D" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { icon: "🤖", label: "Coach IA", color: "#7C3AED" },
    ],
  },
  {
    title: "COMPTE",
    items: [
      { icon: "🔔", label: "Notifications", color: "#0A84FF" },
      { icon: "👤", label: "Mon Profil", color: "#0A84FF" },
      { icon: "💳", label: "Abonnement", color: "#C89B3C" },
      { icon: "🎁", label: "Bons plans", color: "#C89B3C" },
      { icon: "👥", label: "Parrainage", color: "#00D4FF" },
      { icon: "⚙️", label: "Paramètres", color: "#6B7280" },
    ],
  },
]

const screens = [
  { id: "home", label: "Accueil" },
  { id: "profile", label: "Profil" },
  { id: "membership", label: "Abonnement" },
  { id: "notifs", label: "Notifications" },
  { id: "workout", label: "Exercices" },
  { id: "nutrition", label: "Nutrition" },
  { id: "progress", label: "Progrès" },
  { id: "plus", label: "Plus" },
]

export default function MobilePreview() {
  return (
    <div style={{ background: "#0a0a1a" }}>
      {/* ── Screen selector ── */}
      <div className="sticky top-0 z-50 p-4" style={{ background: "rgba(10,10,26,0.95)" }}>
        <h1 className="text-lg font-bold text-white mb-3">📱 Preview Mobile — Adhérent</h1>
        <div className="flex flex-wrap gap-2">
          {screens.map((s) => (
            <a key={s.id} href={`#${s.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: "rgba(10,132,255,0.15)", color: "#0A84FF" }}>
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Each screen in a phone frame ── */}
      {screens.map((screen) => (
        <section key={screen.id} id={screen.id} className="px-4 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="max-w-[390px] mx-auto rounded-[32px] overflow-hidden border shadow-2xl" style={{ borderColor: "rgba(255,255,255,0.1)", background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
            {/* Phone notch */}
            <div className="h-8 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="w-24 h-5 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="px-4 pb-8">
              {screen.id === "home" && (
                <>
                  {/* Hero Banner */}
                  <div className="relative pt-4" style={{ height: "32vh", minHeight: 240 }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #020B22 0%, #0A1628 40%, #1A0A22 100%)" }} />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 15%, rgba(0,136,255,0.2) 0%, transparent 50%), radial-gradient(ellipse at 25% 85%, rgba(255,77,77,0.08) 0%, transparent 40%)" }} />
                    <div className="absolute top-3 left-0 right-0 flex justify-center z-10">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                        <span className="text-white text-lg font-black">IG</span>
                      </div>
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-center px-5 pb-4">
                      <div className="max-w-[55%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px]">☀️</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Bonjour</span>
                        </div>
                        <h1 className="text-2xl font-black text-white leading-tight">Thomas</h1>
                        <p className="text-xs text-gray-300 mt-1 font-medium">Repoussez vos limites aujourd&apos;hui</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full border" style={{ background: "rgba(0,136,255,0.12)", color: "#0088FF", borderColor: "rgba(0,136,255,0.25)" }}>
                            👑 Premium
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            ✨ J-24
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-end justify-end pointer-events-none overflow-hidden">
                      <div className="w-1/2 h-4/5 relative">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0A84FF]/20 to-transparent blur-3xl absolute" />
                      </div>
                    </div>
                  </div>

                  {/* Carte abonnement */}
                  <div className="relative z-20 -mt-5 px-2">
                    <div className="rounded-2xl p-3.5 flex items-center justify-between border" style={{ background: "rgba(10,132,255,0.08)", borderColor: "rgba(10,132,255,0.2)", backdropFilter: "blur(20px)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,155,60,0.15)" }}>
                          <span>👑</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Premium</p>
                          <p className="text-[9px] text-gray-400">J-24 • Valide jusqu&apos;au 05 juil. 2026</p>
                        </div>
                      </div>
                      <span className="text-white opacity-40 text-lg">›</span>
                    </div>
                  </div>

                  {/* Suggestion exercice du jour */}
                  <div className="px-2 mt-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400">EXERCICE DU JOUR</h3>
                      <span className="text-[9px] font-bold" style={{ color: "#0A84FF" }}>VOIR &gt;</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden border flex" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="w-24 shrink-0 relative bg-white/[0.02]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl">🏋️</span>
                        </div>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(8,23,59,0.95) 100%)" }} />
                      </div>
                      <div className="flex-1 flex items-center gap-3 pr-3 py-2.5 pl-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold uppercase" style={{ color: "#0A84FF" }}>Lundi · Pectoraux</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">Développé couché barre</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">4 × 10-12</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,136,255,0.12)", color: "#0088FF" }}>60 kg</span>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">›</span>
                      </div>
                    </div>
                  </div>

                  {/* Grille thématique 3×2 */}
                  <div className="px-2 mt-4">
                    <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-2 px-1">ACCÈS RAPIDES</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: "📅", label: "Planning", c: "#0A84FF" },
                        { icon: "💪", label: "Exercice", c: "#FF4D4D" },
                        { icon: "🤖", label: "Coach IA", c: "#7C3AED" },
                        { icon: "📈", label: "Progrès", c: "#10B981" },
                        { icon: "🥗", label: "Nutrition", c: "#FF6B35" },
                        { icon: "👤", label: "Profil", c: "#00D4FF" },
                      ].map((a) => (
                        <div key={a.label} className="rounded-xl p-3 text-center border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5 text-lg" style={{ background: `${a.c}15` }}>{a.icon}</div>
                          <p className="text-[10px] font-bold text-white leading-tight">{a.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prochain cours */}
                  <div className="px-2 mt-4">
                    <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-2 px-1">PROCHAIN COURS</h3>
                    <div className="rounded-2xl border flex items-center p-3 gap-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="rounded-xl px-3 py-2 text-center min-w-[60px]" style={{ background: "rgba(10,132,255,0.15)" }}>
                        <p className="text-sm font-black text-white">09:00</p>
                        <p className="text-[8px] font-bold" style={{ color: "#0A84FF" }}>AUJOURD&apos;HUI</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">HIIT Intensif</p>
                        <p className="text-[10px] text-gray-400">45 min · Avec Karim</p>
                      </div>
                      <span className="text-gray-500 text-sm">›</span>
                    </div>
                  </div>

                  {/* Bloc Progrès */}
                  <div className="px-2 mt-4">
                    <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-2 px-1">MES PROGRÈS</h3>
                    <div className="rounded-2xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { emoji: "🔥", value: "12", label: "Séances", unit: "ce mois-ci", c: "#FF6B35" },
                          { emoji: "📈", value: "+68%", label: "Progrès", unit: "ce mois-ci", c: "#0A84FF" },
                          { emoji: "🎯", value: "3", label: "Objectifs", unit: "en cours", c: "#C89B3C" },
                        ].map((k) => (
                          <div key={k.label} className="text-center">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1 text-lg" style={{ background: `${k.c}15` }}>{k.emoji}</div>
                            <p className="text-base font-black text-white">{k.value}</p>
                            <p className="text-[9px] text-gray-400 leading-tight">{k.label}</p>
                            <p className="text-[7px] text-gray-500">{k.unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {screen.id === "workout" && (
                <>
                  <div className="pt-5 pb-2">
                    <h1 className="text-lg font-bold text-white">Programme sportif</h1>
                    <p className="text-[10px] text-gray-400 mt-0.5">Plan d&apos;entraînement personnalisé</p>
                  </div>
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {["Lundi", "Mercredi", "Vendredi", "Samedi"].map((d, i) => (
                      <div key={d} className={`shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all ${i === 0 ? "text-white" : "text-gray-300 border border-white/10"}`}
                        style={i === 0 ? { background: "#CC0000" } : { background: "rgba(255,255,255,0.04)" }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl overflow-hidden border mt-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #CC0000, #990000)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>🏋️</span>
                          <div>
                            <p className="text-[9px] text-white/60 uppercase tracking-wider">Séance</p>
                            <p className="text-sm font-bold text-white">Pectoraux & Triceps</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">⏱ 55 min</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: "20%" }} />
                        </div>
                        <span className="text-[10px] font-bold text-white">1/5</span>
                        <span>🏁</span>
                      </div>
                    </div>

                    {[
                      { name: "Développé couché barre", sets: "4", reps: "10-12", weight: "60 kg", done: true },
                      { name: "Développé incliné haltères", sets: "4", reps: "10-12", weight: "24 kg", done: false },
                      { name: "Écarté à la poulie vis-à-vis", sets: "3", reps: "15", weight: "15 kg", done: false },
                      { name: "Extension triceps poulie", sets: "4", reps: "12-15", weight: "20 kg", done: false },
                      { name: "Dips lestés", sets: "3", reps: "10", weight: "10 kg", done: false },
                    ].map((ex, i) => (
                      <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${ex.done ? "bg-green-500/5" : ""}`} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center border border-white/5">
                          <span className="text-lg">🏋️</span>
                        </div>
                        <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${ex.done ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                          {ex.done && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-medium ${ex.done ? "text-gray-500 line-through" : "text-white"}`}>{ex.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">⚡ {ex.sets}×{ex.reps}</span>
                            {ex.weight !== "--" && <span className="text-[9px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-1.5 py-0.5 rounded-full">{ex.weight}</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] ${ex.done ? "text-green-400/50" : "text-white/20"}`}>›</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: "Exercices", value: "1/5", sub: "20% complété", c: "bg-[#CC0000]/10 text-[#CC0000]" },
                      { label: "Temps estimé", value: "55 min", sub: "Par séance", c: "bg-[#0A84FF]/10 text-[#0A84FF]" },
                      { label: "Intensité", value: "Élevée", sub: "Cette semaine", c: "bg-amber-500/10 text-amber-400" },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl border p-2.5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                        <div className={`w-7 h-7 rounded-lg ${s.c} flex items-center justify-center mb-1.5`}><span>⚡</span></div>
                        <p className="text-sm font-bold text-white">{s.value}</p>
                        <p className="text-[9px] text-gray-400">{s.label}</p>
                        <p className="text-[8px] text-gray-500">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white mt-4" style={{ background: "#CC0000", boxShadow: "0 8px 24px rgba(204,0,0,0.3)" }}>
                    ▶ Commencer la séance
                  </button>
                </>
              )}

              {screen.id === "notifs" && (
                <>
                  <div className="pt-6 pb-2">
                    <h1 className="text-lg font-bold text-white">Notifications</h1>
                    <p className="text-xs text-gray-400 mt-0.5">2 non lues</p>
                  </div>
                  <div className="flex rounded-2xl overflow-hidden border mt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    {["TOUTES", "NON LUES", "IMPORTANTES"].map((t, i) => (
                      <button key={t} className="flex-1 py-2.5 text-xs font-bold"
                        style={{ background: i === 0 ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.03)", color: i === 0 ? "#0A84FF" : "rgba(255,255,255,0.4)" }}>
                        {t} <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: i === 0 ? "#0A84FF" : "rgba(255,255,255,0.1)", color: "white" }}>{i === 0 ? 3 : i === 1 ? 2 : 1}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {mockNotifs.map((n) => {
                      const cfg = typeConfig[n.type]
                      return (
                        <div key={n.id} className="rounded-2xl p-4 flex items-start gap-3 border"
                          style={{ background: !n.isRead ? "rgba(10,132,255,0.05)" : "rgba(255,255,255,0.03)", borderColor: !n.isRead ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.06)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg!.bg }}>
                            <cfg.icon className="w-5 h-5" style={{ color: cfg!.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!n.isRead ? "font-bold text-white" : "text-gray-300"}`}>{n.title}</p>
                            <p className="text-xs mt-0.5 line-clamp-2 text-gray-400">{n.description}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "#0A84FF" }} />}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {screen.id === "profile" && (
                <>
                  <div className="pt-8 pb-4 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 mb-4 flex items-center justify-center" style={{ borderColor: "rgba(10,132,255,0.3)", background: "linear-gradient(135deg, #0A84FF, #C89B3C)" }}>
                      <span className="text-3xl">👤</span>
                    </div>
                    <h1 className="text-lg font-bold text-white">Thomas Dubois</h1>
                    <p className="text-xs text-gray-400 mt-0.5">thomas.dubois@email.com</p>
                    <p className="text-xs text-gray-400">+33 6 12 34 56 78</p>
                  </div>
                  <div className="mt-4 space-y-1">
                    {[{ icon: "👤", label: "Informations personnelles", c: "#0A84FF" }, { icon: "💳", label: "Abonnement", c: "#C89B3C" }, { icon: "📄", label: "Paiements & Factures", c: "#10B981" }, { icon: "📁", label: "Documents", c: "#A855F7" }, { icon: "⚙️", label: "Paramètres", c: "#6B7280" }].map((m) => (
                      <div key={m.label} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-lg">{m.icon}</span>
                        <span className="flex-1 text-left text-sm font-bold text-white">{m.label}</span>
                        <span className="text-gray-500">›</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {screen.id === "membership" && (
                <>
                  <div className="pt-6 pb-2"><h1 className="text-lg font-bold text-white">Abonnement</h1></div>
                  <div className="rounded-[20px] overflow-hidden border mt-4" style={{ borderColor: "rgba(200,155,60,0.3)" }}>
                    <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.15), rgba(200,155,60,0.05))" }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #C89B3C, #E0B85D)" }}>
                        <span className="text-3xl">👑</span>
                      </div>
                      <h2 className="text-xl font-black text-white">Premium</h2>
                      <span className="inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">Actif</span>
                    </div>
                    <div className="px-6 py-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <p className="text-sm text-gray-300">Début : <strong className="text-white">05 janv. 2026</strong></p>
                      <p className="text-sm text-gray-300">Fin : <strong className="text-white">05 juil. 2026</strong></p>
                      <p className="text-2xl font-black text-center text-[#C89B3C]">J-24</p>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mt-6 mb-3 px-1">AVANTAGES</h3>
                  <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    {advantages.map((a) => (
                      <div key={a} className="flex items-center gap-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <span className="text-sm text-green-400">✓</span>
                        </div>
                        <span className="text-sm text-gray-300">{a}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-6"
                    style={{ background: "linear-gradient(135deg, #C89B3C, #E0B85D)", boxShadow: "0 8px 24px rgba(200,155,60,0.3)" }}>
                    GÉRER MON ABONNEMENT
                  </button>
                </>
              )}

              {screen.id === "progress" && (
                <>
                  <div className="pt-6 pb-2"><h1 className="text-lg font-bold text-white">Mes Progrès</h1><p className="text-xs text-gray-400 mt-0.5">Cette semaine</p></div>
                  <div className="rounded-[20px] p-5 border mt-4 flex justify-around" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    {[{ emoji: "💪", value: "12", label: "Séances", c: "#0A84FF" }, { emoji: "🔥", value: "3 200", label: "Calories", c: "#FF6B35" }, { emoji: "⏱️", value: "6h30", label: "Durée", c: "#10B981" }].map((k) => (
                      <div key={k.label} className="text-center">
                        <span className="text-2xl">{k.emoji}</span>
                        <p className="text-lg font-black text-white">{k.value}</p>
                        <p className="text-[10px] text-gray-400">{k.label}</p>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mt-6 mb-3 px-1">ÉVOLUTION DU POIDS</h3>
                  <div className="rounded-[20px] p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
                      {mockWeightData.map((d, i) => (
                        <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-white">{d.poids}</span>
                          <div className="w-full rounded-lg transition-all" style={{ height: `${((d.poids - minW) / rangeW) * 80 + 10}%`, background: "linear-gradient(180deg, #0A84FF, #0066CC)", opacity: 0.6 + (i / mockWeightData.length) * 0.4 }} />
                          <span className="text-[9px] text-gray-500 mt-1">{d.week}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mt-6 mb-3 px-1">BADGES</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {badges.map((b) => (
                      <div key={b.name} className={`rounded-2xl p-4 text-center border ${b.earned ? "" : "opacity-50"}`}
                        style={{ background: b.earned ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", borderColor: b.earned ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)" }}>
                        <div className="text-3xl mb-2">{b.emoji}</div>
                        <p className="text-[10px] font-bold text-white leading-tight">{b.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {screen.id === "nutrition" && (
                <>
                  <div className="pt-6 pb-2"><h1 className="text-lg font-bold text-white">Nutrition</h1><p className="text-xs text-gray-400 mt-0.5">Aujourd&apos;hui</p></div>
                  <div className="rounded-[20px] p-5 border mt-4 grid grid-cols-2 gap-4" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    {macros.map((m) => {
                      const pct = Math.round((parseInt(m.value.replace(/\s/g, "")) / parseInt(m.target)) * 100)
                      return (
                        <div key={m.label}>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{m.icon}</span>
                            <span className="text-[10px] text-gray-400">{m.label}</span>
                          </div>
                          <p className="text-lg font-black text-white">{m.value}</p>
                          <p className="text-[10px] text-gray-500">/ {m.target} kcal</p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: m.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 mt-6 mb-3 px-1">REPAS</h3>
                  <div className="space-y-3">
                    {meals.map((m) => (
                      <div key={m.name} className="rounded-[20px] p-4 flex items-center gap-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${m.color}15` }}>
                          <span>{m.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-white">{m.name}</p>
                            <span className="text-xs font-bold text-white">{m.calories} kcal</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{m.time}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.items.map((item) => (
                              <span key={item} className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{item}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {screen.id === "plus" && (
                <>
                  <div className="pt-5 pb-1 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] flex items-center justify-center shadow-lg">
                        <span className="text-white text-[10px] font-black">IG</span>
                      </div>
                      <div>
                        <h1 className="text-base font-bold text-white">Plus</h1>
                        <p className="text-[9px] text-gray-400">Toutes les fonctionnalités</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-5">
                    {plusMenuSections.map((section) => (
                      <div key={section.title}>
                        <h3 className="text-[9px] font-bold tracking-[0.15em] text-gray-500 mb-1.5 px-1">{section.title}</h3>
                        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                          {section.items.map((item, idx) => (
                            <div key={item.label} className="flex items-center gap-3.5 px-3.5 py-3" style={{ borderBottom: idx < section.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${item.color}15` }}>{item.icon}</div>
                              <span className="flex-1 text-left text-xs font-bold text-white">{item.label}</span>
                              <span className="text-gray-500 text-xs">›</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Home indicator */}
            <div className="h-6 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="w-28 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>
          </div>
        </section>
      ))}

      {/* ── Bottom spacing ── */}
      <div className="h-12 text-center text-xs text-gray-600 pb-8">
        Preview Mobile — IGC Infinity Gym Center
      </div>
    </div>
  )
}
