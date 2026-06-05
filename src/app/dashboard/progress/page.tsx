"use client"

import { useState } from "react"
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts"
import { TrendingUp, Weight, Activity, Target, Plus, ChevronDown } from "lucide-react"

const weightData = [
  { week: "S-8", poids: 82.5, masseMuscle: 38.2 },
  { week: "S-7", poids: 81.8, masseMuscle: 38.6 },
  { week: "S-6", poids: 81.0, masseMuscle: 39.1 },
  { week: "S-5", poids: 80.4, masseMuscle: 39.5 },
  { week: "S-4", poids: 79.5, masseMuscle: 40.2 },
  { week: "S-3", poids: 79.0, masseMuscle: 40.8 },
  { week: "S-2", poids: 78.4, masseMuscle: 41.3 },
  { week: "S-1", poids: 78.0, masseMuscle: 41.8 },
]

const bodyFatData = [
  { month: "Jan", gras: 16.5 },
  { month: "Fév", gras: 16.0 },
  { month: "Mar", gras: 15.4 },
  { month: "Avr", gras: 14.8 },
  { month: "Mai", gras: 14.2 },
]

const weeklySessions = [
  { day: "Lun", sessions: 1 },
  { day: "Mar", sessions: 1 },
  { day: "Mer", sessions: 0 },
  { day: "Jeu", sessions: 1 },
  { day: "Ven", sessions: 1 },
  { day: "Sam", sessions: 1 },
  { day: "Dim", sessions: 0 },
]

const goalsRadial = [
  { name: "Poids", value: 82, fill: "#FF4D4D", max: 100 },
  { name: "Muscle", value: 65, fill: "#2563EB", max: 100 },
  { name: "Force", value: 45, fill: "#10B981", max: 100 },
]

const metrics = [
  { label: "Poids actuel", value: "78.0", unit: "kg", change: -4.5, icon: Weight, color: "bg-green-500/10 text-green-400" },
  { label: "Masse musculaire", value: "41.8", unit: "kg", change: 3.6, icon: Activity, color: "bg-brand-blue/10 text-brand-blue" },
  { label: "Masse grasse", value: "14.2", unit: "%", change: -2.3, icon: Target, color: "bg-purple-500/10 text-purple-400" },
  { label: "Objectif atteint", value: "65", unit: "%", change: 15, icon: TrendingUp, color: "bg-amber-500/10 text-amber-400" },
]

const achievements = [
  { label: "10 séances consécutives", desc: "Assiduité parfaite", date: "15 Mai 2026" },
  { label: "Nouveau record personnel", desc: "Développé couché 80 kg", date: "10 Mai 2026" },
  { label: "Objectif poids atteint", desc: "Perte de 5 kg depuis janvier", date: "1 Mai 2026" },
  { label: "Mensualité record", desc: "18 séances en avril", date: "30 Avr 2026" },
]

const goals = [
  { label: "Poids cible", current: 78, target: 75, unit: "kg", info: "Perte de poids progressive" },
  { label: "Séances / semaine", current: 5, target: 5, unit: "séances", info: "Objectif atteint !" },
  { label: "Record développé couché", current: 80, target: 100, unit: "kg", info: "+5 kg ce mois" },
  { label: "Eau quotidienne", current: 2.0, target: 2.5, unit: "L", info: "Objectif journalier" },
]

export default function ProgressPage() {
  const [weightView, setWeightView] = useState<"weight" | "muscle" | "fat">("weight")

  const currentWeight = weightData[weightData.length - 1]
  const startWeight = weightData[0]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Progression</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suivez votre évolution dans le temps</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
          <Plus className="w-4 h-4" /> Nouvelle mesure
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="glass rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${m.color} flex items-center justify-center`}>
                <m.icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${m.change > 0 ? "text-green-400" : "text-red-400"}`}>
                {m.change > 0 ? "+" : ""}{m.change}
              </span>
            </div>
            <p className="text-xs text-gray-400">{m.label}</p>
            <p className="text-xl font-bold text-white">{m.value} <span className="text-xs font-normal text-gray-500">{m.unit}</span></p>
          </div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Évolution du poids</h3>
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {(["weight", "muscle", "fat"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setWeightView(v)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  weightView === v ? "glass text-white shadow-sm" : "text-gray-400"
                }`}
              >
                {v === "weight" ? "Poids" : v === "muscle" ? "Muscle" : "Masse grasse"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {weightView === "weight" ? (
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 85]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, background: "rgba(10,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                  labelStyle={{ fontWeight: 700, color: "#fff" }}
                  formatter={(value) => [`${value} kg`, "Poids"]}
                />
                <Area type="monotone" dataKey="poids" stroke="#FF4D4D" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: "#FF4D4D", strokeWidth: 2, r: 4 }} />
              </AreaChart>
            ) : weightView === "muscle" ? (
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[36, 44]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, background: "rgba(10,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                  labelStyle={{ fontWeight: 700, color: "#fff" }}
                  formatter={(value) => [`${value} kg`, "Masse musculaire"]}
                />
                <Area type="monotone" dataKey="masseMuscle" stroke="#2563EB" strokeWidth={2.5} fill="url(#muscleGrad)" dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }} />
              </AreaChart>
            ) : (
              <AreaChart data={bodyFatData}>
                <defs>
                  <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[13, 18]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, background: "rgba(10,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                  labelStyle={{ fontWeight: 700, color: "#fff" }}
                  formatter={(value) => [`${value}%`, "Masse grasse"]}
                />
                <Area type="monotone" dataKey="gras" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#fatGrad)" dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-red" /> Poids: {startWeight.poids} → {currentWeight.poids} kg
          </span>
          <span className="font-bold text-green-400">-{(startWeight.poids - currentWeight.poids).toFixed(1)} kg</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-strong rounded-2xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Séances cette semaine</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, background: "rgba(10,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
                  formatter={(value) => [`${value} séance${Number(value) > 1 ? "s" : ""}`, ""]}
                />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]} fill="#FF4D4D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-strong rounded-2xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Objectifs</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" barSize={12} data={goalsRadial} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.05)" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, background: "rgba(10,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-white">
                  Objectifs
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs">
            {[{ label: "Poids", color: "bg-brand-red" }, { label: "Muscle", color: "bg-blue-500" }, { label: "Force", color: "bg-green-500" }].map((g) => (
              <span key={g.label} className="flex items-center gap-1.5 text-gray-300">
                <span className={`w-2 h-2 rounded-full ${g.color}`} />
                {g.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-bold text-white mb-4">Détail des objectifs</h3>
        <div className="space-y-4">
          {goals.map((obj, i) => {
            const progress = Math.min((obj.current / obj.target) * 100, 100)
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-white">{obj.label}</p>
                    <p className="text-xs text-gray-400">{obj.info}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {obj.current} <span className="text-xs font-normal text-gray-500">/ {obj.target} {obj.unit}</span>
                    </p>
                    <p className={`text-[10px] font-bold ${progress >= 100 ? "text-green-400" : "text-brand-red"}`}>
                      {progress >= 100 ? "Objectif atteint" : `${Math.round(progress)}%`}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-brand-red"}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-bold text-white mb-4">Réalisations</h3>
        <div className="space-y-3">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{a.label}</p>
                <p className="text-xs text-gray-400">{a.desc} · {a.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
