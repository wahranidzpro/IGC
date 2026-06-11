"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, Sparkles } from "lucide-react"
import BackButton from "@/components/dashboard/mobile/BackButton"

interface Message {
  role: "user" | "coach"
  content: string
}

const suggestions = [
  "Perdre du poids",
  "Prendre du muscle",
  "Programme débutant",
  "Nutrition",
]

const initialMessages: Message[] = [
  {
    role: "coach",
    content: "Bonjour Karim ! 👋 Je suis ton coach IA. Quels sont tes objectifs aujourd'hui ?",
  },
]

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setInput("")
    setLoading(true)

    setTimeout(() => {
      const responses: Record<string, string> = {
        "Perdre du poids": "Excellent choix ! Voici un programme adapté :\n• Cardio 30min/jour\n• Déficit calorique -300\n• Hydratation 2.5L/jour\n• 3 séances musculation/semaine",
        "Prendre du muscle": "Objectif musculation ! 💪\n• Protéines : 2g/kg poids\n• Série lourde 6-8 reps\n• Repos 48h par groupe\n• Suppléments : whey, créatine",
        "Programme débutant": "Bienvenue au gym ! 🏋️\n• Full body 3x/semaine\n• Exercices de base\n• 12-15 reps par série\n• Commencez léger, augmentez progressivement",
        "Nutrition": "Voici mes conseils nutrition :\n• Petit-déj : protéines + glucides lents\n• Déjeuner : protéines + légumes\n• Dîner : léger, protéines\n• Collation : fruits, oléagineux",
      }
      const response = responses[text] || "Super objectif ! Je te recommande de commencer par des séances régulières et de suivre tes progrès. Tu veux plus de détails sur un sujet spécifique ?"
      setMessages((prev) => [...prev, { role: "coach", content: response }])
      setLoading(false)
    }, 1000)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}
    >
      <BackButton label="Coach IA" />
      <div className="px-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Coach IA</h1>
            <p className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              En ligne
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user" ? "rounded-tr-md" : "rounded-tl-md"
              }`}
              style={{
                background: msg.role === "user" ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  msg.role === "user" ? "rgba(10,132,255,0.2)" : "rgba(255,255,255,0.06)"
                }`,
              }}
            >
              {msg.role === "coach" && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span className="text-[10px] font-bold text-[#A855F7]">Coach IA</span>
                </div>
              )}
              <p className="text-sm text-white whitespace-pre-line leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-tl-md p-4"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] text-gray-500 mb-2 text-center">Suggestions</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "rgba(124,58,237,0.1)",
                  color: "#A855F7",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,15,35,0.95)" }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm text-white outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: input.trim() ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "rgba(255,255,255,0.05)",
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
